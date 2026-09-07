import { courses } from '../../../data/courses'
import { insights } from '../../../data/insights'

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const staticUrls = [
    '/',
    '/about',
    '/courses',
    '/admissions',
    '/student-life',
    '/insights',
    '/contact',
    '/gallery',
    '/testimonials',
    '/privacy',
    '/terms'
  ]
  const courseUrls = courses.map((c) => `/courses/${c.slug}`)
  const insightUrls = insights.map((i) => `/insights/${i.slug}`)
  const urls = [...staticUrls, ...courseUrls, ...insightUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map((u) => `<url><loc>${base}${u}</loc><changefreq>weekly</changefreq></url>`)
      .join('\n')}
  </urlset>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
