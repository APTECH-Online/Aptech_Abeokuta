import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from './lib/supabase/config'
import { publishedCourseSlugExists } from './lib/courses-public'
import { publishedInsightSlugExists } from './lib/insights-public'
import { findSlugRedirect } from './lib/seo-redirects'
import { RESERVED_INSIGHT_SLUGS, staticNotFoundHtml } from './lib/seo'
import { LEGACY_REDIRECTS } from './lib/legacy-redirects'

/**
 * Answers legacy HTML URLs and CMS slug requests with genuine HTTP
 * statuses BEFORE Next starts rendering. Legacy migrations are 301s; CMS
 * slug changes are also emitted as 301s for the SEO migration requirement.
 *
 * Why this has to happen here and not in the page component: this app's
 * root loading.tsx wraps every route in a Suspense boundary, so every page
 * response streams — and once a response starts streaming, its HTTP status
 * is locked at 200 (this is documented Next.js behavior, not a bug: see
 * node_modules/next/dist/docs/.../file-conventions/loading.md#status-codes).
 * A page calling notFound() or permanentRedirect() still renders the right
 * UI and a noindex meta tag, but the raw status Google/analytics/uptime
 * checks see stays 200. Running the check in proxy answers the request
 * before any rendering — and therefore before any streaming — begins, so a
 * real 404 or 301 goes out on the wire.
 *
 * The page components still do this same check themselves (see
 * app/(site)/courses/[slug]/page.tsx and insights/[slug]/page.tsx) — that
 * is a deliberate, harmless duplication, not dead code: it keeps the right
 * UI and noindex meta rendering as a fallback if this check is ever
 * bypassed (a cached response, a config change, etc.), it's just no longer
 * the only thing determining the HTTP status.
 *
 * Kept deliberately cheap (a single indexed column, `limit(1)`) because it
 * runs on every matching request. Any failure (Supabase not configured, a
 * network blip) fails OPEN — the request passes through to the page, which
 * behaves exactly as it did before this check existed — so an infra hiccup
 * degrades to "slightly wrong HTTP status on a 404" rather than "the course
 * catalogue stops working".
 */
function handleLegacyRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname.replace(/\/$/, '') || '/'
  const target = LEGACY_REDIRECTS[pathname]
  if (!target) return null

  const url = new URL(target, request.url)
  // Preserve query parameters (for example, old campaign links) while making
  // the path itself canonical.
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value))
  return NextResponse.redirect(url, 301)
}

async function handleSlugRequest(request: NextRequest, base: '/courses' | '/insights', slug: string): Promise<NextResponse | null> {
  try {
    const exists = base === '/courses' ? await publishedCourseSlugExists(slug) : await publishedInsightSlugExists(slug)
    if (exists) return null // let the page render normally

    const target = await findSlugRedirect(base, slug)
    if (target) return NextResponse.redirect(new URL(target, request.url), 301)

    return new NextResponse(staticNotFoundHtml(new URL('/', request.url).toString(), new URL('/courses', request.url).toString()), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' }
    })
  } catch (err) {
    console.error('[proxy] slug check failed, passing request through', err)
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const legacyRedirect = handleLegacyRedirect(request)
  if (legacyRedirect) return legacyRedirect

  // /courses/<slug> and /insights/<slug> — exactly one segment after the
  // base, so this never matches /courses or /insights themselves, or a
  // second-level route like /insights/blog (those are handled below by the
  // reserved-slug check, since they share the same URL shape as a real slug).
  const courseMatch = /^\/courses\/([^/]+)\/?$/.exec(pathname)
  const insightMatch = /^\/insights\/([^/]+)\/?$/.exec(pathname)

  if (courseMatch) {
    const result = await handleSlugRequest(request, '/courses', decodeURIComponent(courseMatch[1]))
    // A course/insight path is never an admin route, so once the slug check
    // has cleared it (or there was nothing to check), there is nothing
    // further for this function to do — skip the unrelated CRM auth logic
    // below rather than run an unnecessary session lookup on every page view.
    return result ?? NextResponse.next()
  }
  if (insightMatch && !RESERVED_INSIGHT_SLUGS.includes(insightMatch[1])) {
    const result = await handleSlugRequest(request, '/insights', decodeURIComponent(insightMatch[1]))
    return result ?? NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const { url: supabaseUrl, anonKey } = getSupabaseConfig()

  // Keep the public site available when Supabase has not been configured yet.
  // Protected CRM pages will redirect once the server has a working config.
  if (!supabaseUrl || !anonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      }
    }
  })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  if (isAdminRoute && !isLoginRoute && !user) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (isAdminRoute && !isLoginRoute && user) {
    const { data: staff } = await supabase
      .from('staff')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!staff?.is_active) {
      return new NextResponse('Access Denied', { status: 403 })
    }

    if (pathname === '/admin') {
      if (staff.role === 'content_manager') return NextResponse.redirect(new URL('/admin/insights', request.url))
      if (staff.role === 'admissions_officer') return NextResponse.redirect(new URL('/admin/leads', request.url))
    }

    const allowed =
      staff.role === 'super_admin' ||
      (staff.role === 'content_manager' && pathname.startsWith('/admin/insights')) ||
      (staff.role === 'admissions_officer' && (pathname.startsWith('/admin/leads') || pathname.startsWith('/admin/applications') || pathname.startsWith('/admin/follow-ups')))

    if (!allowed) return new NextResponse('Access Denied', { status: 403 })
  }

  return response
}

export const config = {
  // Next.js requires matcher values to be statically analyzable at build time.
  // Keep this explicit rather than spreading Object.keys(LEGACY_REDIRECTS).
  matcher: [
    '/admin/:path*',
    '/courses/:slug',
    '/insights/:slug',
    '/sitemap',
    '/index.html',
    '/about.html',
    '/courses.html',
    '/gallery.html',
    '/contact.html'
  ]
}
