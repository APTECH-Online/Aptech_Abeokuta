/**
 * Security headers for every response. Plain CommonJS so next.config.js can load it
 * and tests can import it. Kept free of dependencies.
 *
 * CSP notes:
 *  - script-src keeps 'unsafe-inline' because Next.js injects inline bootstrap
 *    scripts and this site renders JSON-LD in inline <script> tags. A nonce-based
 *    policy (generated per request in proxy.ts) is the stricter follow-up.
 *  - Allowed third parties: Cloudflare Turnstile (script + iframe), Google Maps
 *    (contact page iframe) and the project's Supabase host (uploaded images + API).
 *  - Set CSP_REPORT_ONLY=true to ship the policy as Content-Security-Policy-Report-Only
 *    first and watch the browser console for violations before enforcing it.
 */

function originOf(url) {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function buildCsp({ supabaseUrl, isDev } = {}) {
  const supabase = originOf(supabaseUrl)
  const supabaseWs = supabase ? supabase.replace(/^http/, 'ws') : null
  const list = (...items) => items.flat().filter(Boolean)

  const directives = {
    'default-src': ["'self'"],
    'script-src': list("'self'", "'unsafe-inline'", isDev && "'unsafe-eval'", 'https://challenges.cloudflare.com'),
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': list("'self'", 'data:', 'blob:', supabase),
    'font-src': ["'self'", 'data:'],
    'connect-src': list("'self'", supabase, supabaseWs, 'https://challenges.cloudflare.com', isDev && 'ws:', isDev && 'wss:'),
    'frame-src': ['https://challenges.cloudflare.com', 'https://www.google.com', 'https://maps.google.com'],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"]
  }
  if (!isDev) directives['upgrade-insecure-requests'] = []

  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join('; ')
}

function buildSecurityHeaders({ supabaseUrl, isDev = false, reportOnly = false } = {}) {
  const headers = [
    { key: reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', value: buildCsp({ supabaseUrl, isDev }) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }
  ]
  // HSTS only makes sense over HTTPS; sending it from localhost is harmless but pointless.
  if (!isDev) headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' })
  return headers
}

module.exports = { buildCsp, buildSecurityHeaders }
