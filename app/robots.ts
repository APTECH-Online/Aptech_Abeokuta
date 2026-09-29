import type { MetadataRoute } from 'next'
import { getSiteUrl } from '../lib/seo'

/**
 * robots.txt — the ONLY robots implementation (public/robots.txt was removed:
 * it conflicted with this file and pointed at a relative sitemap URL).
 *
 * Crawlers may fetch everything public, including /_next/ assets, images, CSS
 * and JS, which Google needs to render pages. Blocked: the staff CRM and the
 * API routes (cron, lead export). As defence in depth, next.config.js also
 * sends `X-Robots-Tag: noindex, nofollow` on /admin and /api, and the admin
 * layout sets a noindex meta tag — so a URL that leaks anyway still stays
 * out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/']
      }
    ],
    sitemap: `${base}/sitemap.xml`
  }
}
