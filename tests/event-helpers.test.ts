import { describe, expect, it } from 'vitest'
import { availability } from '../lib/event-availability'
import { formatEventWhen, googleCalendarUrl } from '../lib/event-calendar'

describe('availability', () => {
  it('is unlimited without a capacity', () => {
    expect(availability(null, 50)).toEqual({ spots_left: null, is_full: false })
    expect(availability(undefined, 0)).toEqual({ spots_left: null, is_full: false })
  })
  it('counts places left and flags a full event', () => {
    expect(availability(30, 12)).toEqual({ spots_left: 18, is_full: false })
    expect(availability(30, 30)).toEqual({ spots_left: 0, is_full: true })
    expect(availability(30, 45)).toEqual({ spots_left: 0, is_full: true })
  })
})

describe('formatEventWhen', () => {
  it('formats in WAT with a time range', () => {
    const text = formatEventWhen('2027-03-06T09:00:00Z', '2027-03-06T11:00:00Z')
    expect(text).toContain('6 March 2027')
    expect(text).toContain('10:00 AM')
    expect(text).toContain('12:00 PM')
    expect(text.endsWith('WAT')).toBe(true)
  })
  it('returns an empty string for an invalid date', () => {
    expect(formatEventWhen('nope')).toBe('')
  })
})

describe('googleCalendarUrl', () => {
  it('builds a template link with UTC start/end', () => {
    const url = new URL(googleCalendarUrl({ title: 'Open Day', startsAt: '2027-03-06T09:00:00Z', endsAt: '2027-03-06T11:00:00Z', location: 'APTECH Abeokuta' }) as string)
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('text')).toBe('Open Day')
    expect(url.searchParams.get('dates')).toBe('20270306T090000Z/20270306T110000Z')
    expect(url.searchParams.get('location')).toBe('APTECH Abeokuta')
  })
  it('defaults to a two-hour event when there is no end time', () => {
    const url = new URL(googleCalendarUrl({ title: 'x', startsAt: '2027-03-06T09:00:00Z' }) as string)
    expect(url.searchParams.get('dates')).toBe('20270306T090000Z/20270306T110000Z')
  })
  it('returns null for an invalid start', () => {
    expect(googleCalendarUrl({ title: 'x', startsAt: 'bad' })).toBeNull()
  })
})
