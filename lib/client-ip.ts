/**
 * Best-effort client IP from request headers, used as a rate-limit key.
 *
 * Preference order: headers set by the hosting platform (which a visitor cannot
 * forge) before the generic `x-forwarded-for`. On Vercel the platform overwrites
 * `x-forwarded-for` / `x-real-ip` / `x-vercel-forwarded-for`, so the first hop is
 * trustworthy there. Behind a proxy you do not control, treat the result as a
 * hint, not an identity.
 */
export function clientIpFromHeaders(headers: { get(name: string): string | null }): string {
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]
  ]
  for (const candidate of candidates) {
    const ip = candidate?.trim()
    // Cap the length so a crafted header cannot create giant rate-limit keys.
    if (ip) return ip.slice(0, 64)
  }
  return 'unknown'
}
