import { describe, expect, it } from 'vitest'
import { eventRegistrationSchema, registrationFieldErrors } from '../lib/event-registration'

const valid = {
  event_id: '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e',
  full_name: '  Ade Ogundele ',
  email: '  Ade@Example.COM ',
  phone: '',
  interest: 'coding',
  preferred_contact: 'email',
  registration_consent: true,
  marketing_consent: false
}

describe('eventRegistrationSchema', () => {
  it('accepts a valid payload and normalises name and email', () => {
    const r = eventRegistrationSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.full_name).toBe('Ade Ogundele')
      expect(r.data.email).toBe('ade@example.com')
    }
  })

  it('requires an event id, a name, a valid email and consent', () => {
    const r = eventRegistrationSchema.safeParse({ ...valid, event_id: 'nope', full_name: '', email: 'bad', registration_consent: false })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(Object.keys(registrationFieldErrors(r.error)).sort()).toEqual(['email', 'event_id', 'full_name', 'registration_consent'])
    }
  })

  it('requires a phone number when contact by phone or WhatsApp is chosen', () => {
    for (const preferred_contact of ['phone', 'whatsapp']) {
      const r = eventRegistrationSchema.safeParse({ ...valid, preferred_contact })
      expect(r.success).toBe(false)
      if (!r.success) expect(registrationFieldErrors(r.error).phone).toMatch(/phone number/)
    }
    expect(eventRegistrationSchema.safeParse({ ...valid, preferred_contact: 'whatsapp', phone: '0803 123 4567' }).success).toBe(true)
  })

  it('rejects junk phone numbers', () => {
    const r = eventRegistrationSchema.safeParse({ ...valid, phone: 'call me maybe' })
    expect(r.success).toBe(false)
  })

  it('falls back to safe defaults for unknown interest or contact values', () => {
    const r = eventRegistrationSchema.safeParse({ ...valid, interest: 'hacking', preferred_contact: 'carrier-pigeon' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.interest).toBe('general')
      expect(r.data.preferred_contact).toBe('email')
    }
  })

  it('treats a non-boolean marketing flag as false and passes the honeypot through', () => {
    const r = eventRegistrationSchema.safeParse({ ...valid, marketing_consent: 'yes', company_website: 'http://spam' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.marketing_consent).toBe(false)
      expect(r.data.company_website).toBe('http://spam')
    }
  })
})
