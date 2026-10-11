import { describe, expect, it } from 'vitest'
import { clientIpFromHeaders } from '../lib/client-ip'

const h = (init: Record<string, string>) => new Headers(init)

describe('clientIpFromHeaders', () => {
  it('prefers the platform header over a spoofable x-forwarded-for', () => {
    expect(clientIpFromHeaders(h({ 'x-vercel-forwarded-for': '1.1.1.1', 'x-forwarded-for': '6.6.6.6' }))).toBe('1.1.1.1')
  })
  it('falls back to x-real-ip then the first x-forwarded-for hop', () => {
    expect(clientIpFromHeaders(h({ 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '6.6.6.6' }))).toBe('2.2.2.2')
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '3.3.3.3, 10.0.0.1' }))).toBe('3.3.3.3')
  })
  it('returns "unknown" when nothing is present and caps absurd values', () => {
    expect(clientIpFromHeaders(h({}))).toBe('unknown')
    expect(clientIpFromHeaders(h({ 'x-real-ip': 'a'.repeat(500) })).length).toBe(64)
  })
})
