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
  images: {
    remotePatterns: supabaseImageRemotePatterns()
  }
}

module.exports = nextConfig
