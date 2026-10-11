import { beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstile, turnstileTokenFromFormData, TURNSTILE_FIELD } from '../lib/turnstile'

beforeEach(() => vi.stubEnv('TURNSTILE_SECRET_KEY', ''))

describe('verifyTurnstile', () => {
  it('is skipped (allowed) when no secret is configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await verifyTurnstile('anything')).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  describe('with a secret', () => {
    beforeEach(() => vi.stubEnv('TURNSTILE_SECRET_KEY', 'shh'))

    it('rejects a missing or empty token without calling Cloudflare', async () => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      expect(await verifyTurnstile(undefined)).toMatchObject({ ok: false, reason: 'missing-token' })
      expect(await verifyTurnstile('   ')).toMatchObject({ ok: false, reason: 'missing-token' })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('accepts a token Cloudflare approves, forwarding secret, token and IP', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))
      vi.stubGlobal('fetch', fetchMock)
      expect(await verifyTurnstile('good-token', '9.9.9.9')).toEqual({ ok: true })
      const body = fetchMock.mock.calls[0][1].body as URLSearchParams
      expect(body.get('secret')).toBe('shh')
      expect(body.get('response')).toBe('good-token')
      expect(body.get('remoteip')).toBe('9.9.9.9')
    })

    it('does not send an unknown IP', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))
      vi.stubGlobal('fetch', fetchMock)
      await verifyTurnstile('t', 'unknown')
      expect((fetchMock.mock.calls[0][1].body as URLSearchParams).has('remoteip')).toBe(false)
    })

    it('rejects a token Cloudflare refuses', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))))
      expect(await verifyTurnstile('bad')).toMatchObject({ ok: false, reason: 'rejected' })
    })

    it('fails closed when verification is unreachable', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
      expect(await verifyTurnstile('t')).toMatchObject({ ok: false, reason: 'verification-unavailable' })
    })
  })
})

describe('turnstileTokenFromFormData', () => {
  it('reads the widget field and tolerates absence', () => {
    const fd = new FormData()
    expect(turnstileTokenFromFormData(fd)).toBe('')
    fd.set(TURNSTILE_FIELD, 'abc')
    expect(turnstileTokenFromFormData(fd)).toBe('abc')
  })
})
