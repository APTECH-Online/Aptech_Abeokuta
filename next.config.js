/** @type {import('next').NextConfig} */

// The CRM (gallery, insights, and now partner logos) stores uploaded images
// in Supabase Storage and renders them with next/image, which requires the
// remote host to be explicitly allow-listed. Read from the same env vars
// lib/supabase/config.ts uses, so this stays in sync with whichever
// Supabase project is configured without hardcoding a project ref here.
function supabaseImageRemotePatterns() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return []
  try {
    const { protocol, hostname } = new URL(url)
    return [
      {
        protocol: protocol.replace(':', ''),
        hostname,
        pathname: '/storage/v1/object/public/**'
      }
    ]
  } catch {
    return []
  }
}

const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in a response header.
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseImageRemotePatterns(),
    // Serve AVIF/WebP to browsers that support them (falls back to the source
    // format otherwise) — smaller images, better LCP on mobile networks.
    formats: ['image/avif', 'image/webp']
  },

  async headers() {
    return [
      // Defence in depth on top of robots.txt + <meta robots>: the staff CRM
      // and API responses must never be indexed, even if a URL leaks.
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // Files in /public are served un-hashed, so give repeat visitors and
      // social crawlers a sensible cache without making replacements sticky.
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }]
      }
    ]
  }
}

module.exports = nextConfig
