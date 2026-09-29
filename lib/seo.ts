import type { Metadata } from 'next'
import { siteConfig } from '../data/site'

/**
 * Single source of truth for everything SEO-related that is not page copy:
 * the canonical origin, the <head> metadata builder every public page uses,
 * and a few pure text helpers. Pure data + pure functions (no DB access), so
 * it is safe to import from server components, route handlers and config.
 */

const CANONICAL_SITE_URL = 'https://www.aptech-abeokuta.com.ng'

/**
 * The production canonical origin. It is intentionally not derived from a
 * Vercel preview/project hostname, because those are deployment addresses
 * rather than the public canonical website.
 */
export function getSiteUrl(): string {
  // This is the production canonical origin. Do not derive SEO URLs from a
  // Vercel preview/project hostname: those hosts are deployment addresses,
  // not the public canonical website. NEXT_PUBLIC_SITE_URL may still be set
  // in deployments for documentation/backwards compatibility, but canonical
  // SEO output intentionally remains pinned to the verified production host.
  return CANONICAL_SITE_URL
}

/** Kept for backwards compatibility with callers/docs from the earlier SEO setup. */
export function isPlaceholderSiteUrl(): boolean {
  return false
}

/** Turns a site-relative path ("/courses") or an absolute URL into an absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${getSiteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/**
 * Default social-share image. Deliberately a 1200×630 PNG: WhatsApp,
 * Facebook, LinkedIn and X do not render SVG previews, which is what the
 * site used before.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/images/og-default.png',
  width: 1200,
  height: 630,
  alt: 'APTECH Abeokuta — computer and IT training in Abeokuta, Ogun State'
}

export const SITE_LOCALE = 'en_NG'

/** Appends the brand to a page title unless it is already there. */
export function brandTitle(part: string): string {
  return /aptech/i.test(part) ? part : `${part} | ${siteConfig.name}`
}

/** Collapses HTML/whitespace to plain text (for descriptions and FAQ answers). */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Truncates at a word boundary and adds an ellipsis when it had to cut. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`
}

/**
 * Picks the first title candidate that fits a search-result-friendly length.
 * Falls back to the last (shortest) candidate rather than truncating a title
 * mid-word.
 */
export function pickTitle(candidates: string[], max = 65): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1]
}

export interface SeoInput {
  /** The complete <title> — the root title template is bypassed. */
  title: string
  description: string
  /** Canonical path, e.g. "/courses/linux". Query strings never belong here. */
  path: string
  /** Absolute URL or site-relative path. Falls back to the default 1200×630 image. */
  image?: string | null
  imageAlt?: string
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  section?: string | null
  /** noindex,follow — for pages that must stay reachable but out of search. */
  noindex?: boolean
}

/**
 * Builds the complete metadata object for a public page: title, description,
 * self-referencing canonical, robots, Open Graph and Twitter/X card — all
 * carrying the same title/description/image so social previews match search.
 *
 * Why this exists: Next.js shallow-merges metadata, so a page that sets its
 * own `openGraph` silently discards the layout's `openGraph.images`. Building
 * every page's social block in one place guarantees og:image, og:url,
 * og:site_name and twitter:image are never dropped.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const { title, description, path, noindex, type = 'website' } = input
  const image = input.image
    ? { url: input.image, alt: input.imageAlt ?? title }
    : DEFAULT_OG_IMAGE

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type,
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: SITE_LOCALE,
      images: [image],
      ...(type === 'article'
        ? {
            ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
            ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
            ...(input.section ? { section: input.section } : {})
          }
        : {})
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url]
    }
  }
}

/**
 * Normalises a Nigerian phone number to E.164 ("+2348034152557") for
 * `tel:` links and structured data. Handles the "+234 (0) 803 ..." style
 * used in the CRM. Returns null if it doesn't look like a real number, so
 * callers can skip the link/schema field instead of emitting a bad one.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\(0\)/g, '').replace(/\D/g, '')
  let e164: string
  if (digits.startsWith('234')) e164 = `+${digits}`
  else if (digits.startsWith('0')) e164 = `+234${digits.slice(1)}`
  else e164 = `+${digits}`
  return /^\+\d{10,15}$/.test(e164) ? e164 : null
}

export function telHref(raw: string | null | undefined): string | null {
  const e164 = toE164(raw)
  return e164 ? `tel:${e164}` : null
}

/** Google Maps directions/search deep link built from the real CRM address. */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Abeokuta, Nigeria`)}`
}

const DAY_INDEX: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
}
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function parseDays(label: string): number[] {
  const text = label.toLowerCase().replace(/[–—]/g, '-')
  const range = /^([a-z]+)\s*(?:-|to)\s*([a-z]+)$/.exec(text.trim())
  const idx = (word: string) => DAY_INDEX[word.slice(0, 3)]
  if (range && idx(range[1]) !== undefined && idx(range[2]) !== undefined) {
    const out: number[] = []
    for (let d = idx(range[1]); ; d = (d + 1) % 7) {
      out.push(d)
      if (d === idx(range[2]) || out.length > 7) break
    }
    return out
  }
  return text
    .split(/[,&/]|\band\b/)
    .map((w) => idx(w.trim()))
    .filter((d): d is number => d !== undefined)
}

function to24h(hour: string, minute: string | undefined, meridiem: string | undefined): string | null {
  let h = Number(hour)
  const m = Number(minute ?? '0')
  if (!Number.isFinite(h) || h > 23 || m > 59) return null
  if (meridiem) {
    const pm = meridiem.toLowerCase() === 'pm'
    if (h < 1 || h > 12) return null
    if (pm && h < 12) h += 12
    if (!pm && h === 12) h = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseTimeRange(label: string): { opens: string; closes: string } | null {
  const text = label.replace(/[–—]/g, '-')
  const match = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(text)
  if (!match) return null
  const closes = to24h(match[4], match[5], match[6])
  const opens = to24h(match[1], match[2], match[3] ?? match[6])
  if (!opens || !closes || opens >= closes) return null
  return { opens, closes }
}

/**
 * Converts the CRM's free-text office hours (e.g. {day: "Monday – Friday",
 * time: "9:00 AM – 5:00 PM"}) into schema.org OpeningHoursSpecification.
 * Anything it cannot parse with confidence — including "Closed" — is
 * skipped rather than guessed, so structured data never claims hours the
 * visible page doesn't show.
 */
export function openingHoursSpecification(hours: { day: string; time: string }[]) {
  const grouped = new Map<string, { opens: string; closes: string; days: Set<number> }>()
  for (const entry of hours ?? []) {
    const range = parseTimeRange(entry.time ?? '')
    const days = parseDays(entry.day ?? '')
    if (!range || days.length === 0) continue
    const key = `${range.opens}-${range.closes}`
    const bucket = grouped.get(key) ?? { ...range, days: new Set<number>() }
    days.forEach((d) => bucket.days.add(d))
    grouped.set(key, bucket)
  }
  return Array.from(grouped.values()).map((b) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: Array.from(b.days)
      .sort((a, c) => a - c)
      .map((d) => DAY_NAMES[d]),
    opens: b.opens,
    closes: b.closes
  }))
}

/**
 * /insights/[slug] shares its namespace with the static section pages below.
 * An insight given one of these slugs would be unreachable (the static route
 * wins) and would duplicate that page's URL in the sitemap, so the CRM
 * rejects them and the sitemap filters them out.
 */
export const RESERVED_INSIGHT_SLUGS = ['news', 'blog', 'events', 'announcements']

/**
 * Every static, indexable public page. The sitemap is built from this list
 * plus the CMS-driven course and insight URLs — CRM, auth and API routes are
 * never listed. Keep in sync when adding a public page.
 */
export const STATIC_INDEXABLE_PATHS = [
  '/',
  '/about',
  '/courses',
  '/admissions',
  '/student-life',
  '/insights',
  '/insights/news',
  '/insights/blog',
  '/insights/announcements',
  '/insights/events',
  '/contact',
  '/gallery',
  '/testimonials',
  '/privacy',
  '/terms'
]

/**
 * A minimal, on-brand 404 response built as a plain string, for use in
 * proxy.ts (see proxy.ts's course/insight slug check). This deliberately
 * does NOT render the React not-found UI: this app's root loading.tsx wraps
 * every page in a Suspense boundary, which means the response starts
 * streaming — and the HTTP status becomes permanently locked at 200 — the
 * moment any page begins rendering, including the not-found page itself.
 * The only way to send a genuine 404 status is to answer before Next's
 * render pipeline starts at all, which means a hand-built response.
 * Deliberately no external fonts/images/scripts, so it renders instantly
 * and never depends on anything that could itself 404.
 */
export function staticNotFoundHtml(homeUrl: string, coursesUrl: string): string {
  return `<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Page not found | APTECH Abeokuta</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#1D1250; color:#fff; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; text-align:center; padding:2rem; box-sizing:border-box; }
  .card { max-width:32rem; }
  h1 { font-size:1.5rem; margin:0 0 .75rem; }
  p { color:rgba(255,255,255,0.75); line-height:1.6; margin:0 0 1.5rem; }
  a { display:inline-block; margin:0 .4rem; padding:.65rem 1.25rem; border-radius:.5rem; text-decoration:none; font-weight:600; }
  .primary { background:#EFC077; color:#1D1250; }
  .secondary { border:1px solid rgba(255,255,255,0.3); color:#fff; }
</style>
</head>
<body>
  <div class="card">
    <h1>We couldn't find that page</h1>
    <p>The page may have moved or the link may be out of date. Try the homepage, or browse the course catalogue.</p>
    <a class="primary" href="${homeUrl}">Go to homepage</a>
    <a class="secondary" href="${coursesUrl}">Browse courses</a>
  </div>
</body>
</html>`
}
