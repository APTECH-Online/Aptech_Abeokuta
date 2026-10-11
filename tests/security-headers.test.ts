import { describe, expect, it } from 'vitest'
import { buildCsp, buildSecurityHeaders } from '../lib/security-headers'

const header = (list: { key: string; value: string }[], key: string) => list.find((h) => h.key === key)?.value

describe('buildCsp', () => {
  const csp = buildCsp({ supabaseUrl: 'https://abc.supabase.co/', isDev: false })

  it('locks down the dangerous defaults', () => {
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it('allows only the third parties the site uses', () => {
    expect(csp).toMatch(/script-src [^;]*https:\/\/challenges\.cloudflare\.com/)
    expect(csp).toMatch(/frame-src [^;]*https:\/\/challenges\.cloudflare\.com/)
    expect(csp).toMatch(/frame-src [^;]*https:\/\/www\.google\.com/)
    expect(csp).toMatch(/img-src [^;]*https:\/\/abc\.supabase\.co/)
    expect(csp).toMatch(/connect-src [^;]*wss:\/\/abc\.supabase\.co/)
  })

  it('relaxes eval and websockets in development only', () => {
    const dev = buildCsp({ isDev: true })
    expect(dev).toContain("'unsafe-eval'")
    expect(dev).toMatch(/connect-src [^;]*ws:/)
    expect(dev).not.toContain('upgrade-insecure-requests')
  })

  it('ignores an invalid Supabase URL instead of throwing', () => {
    expect(() => buildCsp({ supabaseUrl: 'not a url', isDev: false })).not.toThrow()
  })
})

describe('buildSecurityHeaders', () => {
  it('sets the standard hardening headers in production', () => {
    const h = buildSecurityHeaders({ isDev: false })
    expect(header(h, 'Strict-Transport-Security')).toContain('max-age=63072000')
    expect(header(h, 'X-Content-Type-Options')).toBe('nosniff')
    expect(header(h, 'X-Frame-Options')).toBe('SAMEORIGIN')
    expect(header(h, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(header(h, 'Permissions-Policy')).toContain('camera=()')
    expect(header(h, 'Content-Security-Policy')).toBeTruthy()
  })
  it('skips HSTS in development', () => {
    expect(header(buildSecurityHeaders({ isDev: true }), 'Strict-Transport-Security')).toBeUndefined()
  })
  it('can ship the CSP in report-only mode', () => {
    const h = buildSecurityHeaders({ reportOnly: true })
    expect(header(h, 'Content-Security-Policy')).toBeUndefined()
    expect(header(h, 'Content-Security-Policy-Report-Only')).toBeTruthy()
  })
})
