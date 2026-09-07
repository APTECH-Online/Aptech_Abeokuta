import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The CRM/staff portal and its APIs must never be indexed.
        disallow: ['/admin', '/api']
      }
    ],
    sitemap: `${base}/sitemap`
  }
}
