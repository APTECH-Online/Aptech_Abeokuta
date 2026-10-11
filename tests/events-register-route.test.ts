import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  eventRow: { title: 'Intro to Coding', slug: 'intro', starts_at: '2027-03-06T09:00:00Z', ends_at: '2027-03-06T11:00:00Z', location: 'APTECH Abeokuta', delivery_mode: 'hybrid', meeting_url: 'https://meet.example/abc' },
  checkRateLimit: vi.fn(),
  verifyTurnstile: vi.fn(),
  recordConsent: vi.fn(),
  logAudit: vi.fn(),
  sendEmail: vi.fn(),
  createNotification: vi.fn(),
  createAdminClient: vi.fn()
}))

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-real-ip': '203.0.113.7' }) }))
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('../lib/rate-limit', () => ({ checkRateLimit: mocks.checkRateLimit }))
vi.mock('../lib/turnstile', async (orig) => ({ ...(await orig<typeof import('../lib/turnstile')>()), verifyTurnstile: mocks.verifyTurnstile }))
vi.mock('../lib/consent', () => ({ recordConsent: mocks.recordConsent }))
vi.mock('../lib/audit', () => ({ logAudit: mocks.logAudit }))
vi.mock('../lib/email/send', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('../lib/notifications', () => ({ createNotification: mocks.createNotification }))

import { POST } from '../app/api/events/register/route'

const EVENT_ID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e'
const payload = (over: Record<string, unknown> = {}) => ({
  event_id: EVENT_ID, full_name: 'Ade Ogundele', email: 'ade@example.com', phone: '08031234567', interest: 'coding',
  preferred_contact: 'email', registration_consent: true, marketing_consent: true, ...over
})
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('https://www.example.test/api/events/register', { method: 'POST', headers: { 'content-type': 'application/json', host: 'www.example.test', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
const rpcRow = (over: Record<string, unknown> = {}) =>
  ({ data: { o_outcome: 'registered', o_registration_id: 'reg-1', o_lead_id: 'lead-1', o_lead_reference: 'APE-2027-000001', o_is_new_lead: true, o_spots_left: 12, ...over }, error: null })

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.values(mocks).forEach((m) => typeof m === 'function' && 'mockReset' in m && (m as ReturnType<typeof vi.fn>).mockReset())
  mocks.checkRateLimit.mockResolvedValue({ allowed: true })
  mocks.verifyTurnstile.mockResolvedValue({ ok: true })
  mocks.recordConsent.mockResolvedValue(undefined)
  mocks.logAudit.mockResolvedValue(undefined)
  mocks.sendEmail.mockResolvedValue(undefined)
  mocks.createNotification.mockResolvedValue(undefined)
  mocks.rpc.mockReturnValue({ maybeSingle: async () => rpcRow() })
  mocks.createAdminClient.mockReturnValue({
    rpc: mocks.rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.eventRow }) }) }) })
  })
})

describe('POST /api/events/register', () => {
  it('registers, creates the lead via the RPC, records consent, emails and notifies staff', async () => {
    const res = await post(payload())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.calendarUrl).toContain('calendar.google.com')

    expect(mocks.rpc).toHaveBeenCalledWith('register_for_campus_event', expect.objectContaining({
      p_event_id: EVENT_ID, p_email: 'ade@example.com', p_full_name: 'Ade Ogundele', p_marketing_consent: true
    }))
    expect(mocks.recordConsent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ leadId: 'lead-1', source: 'event', marketingOptIn: true }))
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    const email = mocks.sendEmail.mock.calls[0][0]
    expect(email.to).toBe('ade@example.com')
    expect(email.subject).toContain('Intro to Coding')
    expect(email.text).toContain('https://meet.example/abc') // hybrid events email the join link
    expect(mocks.createNotification).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'event.registered' }))
  })

  it('refuses a full event with 409 and sends nothing', async () => {
    mocks.rpc.mockReturnValue({ maybeSingle: async () => rpcRow({ o_outcome: 'full', o_lead_id: null, o_spots_left: 0 }) })
    const res = await post(payload())
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('full')
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(mocks.recordConsent).not.toHaveBeenCalled()
  })

  it('tells staff when the last place is taken', async () => {
    mocks.rpc.mockReturnValue({ maybeSingle: async () => rpcRow({ o_spots_left: 0 }) })
    await post(payload())
    expect(mocks.createNotification).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'event.full' }))
  })

  it('handles an existing registration without re-sending email or overwriting', async () => {
    mocks.rpc.mockReturnValue({ maybeSingle: async () => rpcRow({ o_outcome: 'already_registered' }) })
    const res = await post(payload())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.alreadyRegistered).toBe(true)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(mocks.recordConsent).not.toHaveBeenCalled()
  })

  it('rejects closed events', async () => {
    mocks.rpc.mockReturnValue({ maybeSingle: async () => rpcRow({ o_outcome: 'closed' }) })
    const res = await post(payload())
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('closed')
  })

  it('returns field errors for invalid input without touching the database', async () => {
    const res = await post(payload({ email: 'nope', registration_consent: false }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.fieldErrors).toHaveProperty('email')
    expect(body.fieldErrors).toHaveProperty('registration_consent')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON', async () => {
    expect((await post('{not json')).status).toBe(400)
  })

  it('rate limits with a Retry-After header', async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 33 })
    const res = await post(payload())
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('33')
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('event-registration:203.0.113.7')
  })

  it('blocks a failed Turnstile check', async () => {
    mocks.verifyTurnstile.mockResolvedValue({ ok: false, reason: 'rejected' })
    const res = await post(payload({ turnstile_token: 'bad' }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('turnstile')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('passes the token and client IP to Turnstile', async () => {
    await post(payload({ turnstile_token: 'tok' }))
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith('tok', '203.0.113.7')
  })

  it('silently accepts a filled honeypot without registering anyone', async () => {
    const res = await post(payload({ company_website: 'http://spam.example' }))
    expect(res.status).toBe(200)
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('rejects cross-site browser requests', async () => {
    const res = await post(payload(), { origin: 'https://evil.example' })
    expect(res.status).toBe(403)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('accepts same-site browser requests', async () => {
    expect((await post(payload(), { origin: 'https://www.example.test' })).status).toBe(200)
  })

  it('still succeeds when the confirmation email fails', async () => {
    mocks.sendEmail.mockRejectedValue(new Error('smtp down'))
    const res = await post(payload())
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('returns 500 when the database call fails', async () => {
    mocks.rpc.mockReturnValue({ maybeSingle: async () => ({ data: null, error: { message: 'boom' } }) })
    expect((await post(payload())).status).toBe(500)
  })

  it('returns 503 when Supabase is not configured', async () => {
    mocks.createAdminClient.mockImplementation(() => { throw new Error('not configured') })
    expect((await post(payload())).status).toBe(503)
  })
})
