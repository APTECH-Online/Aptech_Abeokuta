import { describe, expect, it } from 'vitest'
import { isoToWatLocal, parseEventForm, slugify, watLocalToIso } from '../lib/event-admin'

const base = {
  title: 'Intro to Web Development',
  event_type: 'coding_workshop',
  delivery_mode: 'in_person',
  starts_at: '2027-03-06T10:00',
  ends_at: '2027-03-06T12:00',
  location: '',
  description: 'Hands-on session',
  capacity: '40',
  registration_open: 'on'
}

describe('WAT conversion', () => {
  it('converts WAT local time to UTC (WAT is UTC+1)', () => {
    expect(watLocalToIso('2027-03-06T10:00')).toBe('2027-03-06T09:00:00.000Z')
  })
  it('round-trips through isoToWatLocal', () => {
    expect(isoToWatLocal('2027-03-06T09:00:00.000Z')).toBe('2027-03-06T10:00')
    expect(isoToWatLocal(watLocalToIso('2027-12-31T23:30') as string)).toBe('2027-12-31T23:30')
  })
  it('handles bad input', () => {
    expect(watLocalToIso('tomorrow')).toBeNull()
    expect(isoToWatLocal(null)).toBe('')
    expect(isoToWatLocal('garbage')).toBe('')
  })
})

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('Intro to Web Development!')).toBe('intro-to-web-development')
    expect(slugify('Café & Code — Open Day')).toBe('cafe-and-code-open-day')
    expect(slugify('  --Hello--  ')).toBe('hello')
  })
})

describe('parseEventForm', () => {
  it('parses a valid form, filling defaults', () => {
    const r = parseEventForm(base)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.slug).toBe('intro-to-web-development')
      expect(r.data.location).toBe('APTECH Abeokuta')
      expect(r.data.starts_at).toBe('2027-03-06T09:00:00.000Z')
      expect(r.data.capacity).toBe(40)
      expect(r.data.registration_open).toBe(true)
      expect(r.data.meeting_url).toBeNull()
    }
  })

  it('reports field errors for missing/invalid fields', () => {
    const r = parseEventForm({ ...base, title: 'a', event_type: 'party', starts_at: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(['title', 'event_type', 'starts_at']))
  })

  it('requires the end to be after the start', () => {
    const r = parseEventForm({ ...base, ends_at: '2027-03-06T09:00' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.ends_at).toMatch(/after the start/)
  })

  it('requires a future start only when asked (create), not when editing', () => {
    const now = new Date('2028-01-01T00:00:00Z')
    expect(parseEventForm(base, { requireFuture: true, now }).ok).toBe(false)
    expect(parseEventForm(base, { requireFuture: false, now }).ok).toBe(true)
  })

  it('requires an https meeting link for online events and rejects insecure ones', () => {
    const online = parseEventForm({ ...base, delivery_mode: 'online' })
    expect(online.ok).toBe(false)
    if (!online.ok) expect(online.fieldErrors.meeting_url).toMatch(/meeting link/)
    expect(parseEventForm({ ...base, delivery_mode: 'online', meeting_url: 'http://zoom.example/x' }).ok).toBe(false)
    const ok = parseEventForm({ ...base, delivery_mode: 'online', meeting_url: 'https://meet.google.com/abc-defg-hij' })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.data.location).toBe('Online')
  })

  it('validates capacity and treats blank as unlimited', () => {
    expect(parseEventForm({ ...base, capacity: '0' }).ok).toBe(false)
    expect(parseEventForm({ ...base, capacity: '2.5' }).ok).toBe(false)
    const unlimited = parseEventForm({ ...base, capacity: '' })
    expect(unlimited.ok && unlimited.data.capacity).toBe(null)
  })

  it('rejects malformed slugs but accepts a clean custom one', () => {
    expect(parseEventForm({ ...base, slug: 'Bad Slug!' }).ok).toBe(false)
    const ok = parseEventForm({ ...base, slug: 'my-custom-slug' })
    expect(ok.ok && ok.data.slug).toBe('my-custom-slug')
  })

  it('treats an unticked registration checkbox as closed', () => {
    const r = parseEventForm({ ...base, registration_open: undefined })
    expect(r.ok && r.data.registration_open).toBe(false)
  })
})
