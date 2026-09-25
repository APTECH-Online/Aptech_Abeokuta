import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from './lib/supabase/config'

export async function proxy(request: NextRequest) {
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

  const { pathname } = request.nextUrl
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
  matcher: ['/admin/:path*']
}
