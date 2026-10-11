import { describe, expect, it } from 'vitest'
import { campusEventJsonLd, campusEventsJsonLd, eventPageUrl, type JsonLdCampusEvent } from '../lib/events-structured-data'

const ctx = {
  baseUrl: 'https://www.example.test',
  organizer: { '@type': 'EducationalOrganization', '@id': 'https://www.example.test/#organization', name: 'APTECH Abeokuta' },
  imageUrl: 'https://www.example.test/og.png',
  campusAddress: { streetAddress: '1 Campus Road', addressLocality: 'Abeokuta', addressRegion: 'Ogun State', addressCountry: 'NG' }
}

const event = (over: Partial<JsonLdCampusEvent> = {}): JsonLdCampusEvent => ({
  id: 'id-1', title: 'Intro to Coding', slug: 'intro-to-coding', event_type: 'coding_workshop', description: 'Learn to code.',
  starts_at: '2027-03-06T09:00:00Z', ends_at: '2027-03-06T11:00:00Z', location: 'APTECH Abeokuta', delivery_mode: 'in_person', ...over
})

describe('campusEventJsonLd', () => {
  it('describes a free in-person event at the campus address', () => {
    const j = campusEventJsonLd(event(), ctx) as any
    expect(j['@type']).toBe('Event')
    expect(j.startDate).toBe('2027-03-06T09:00:00Z')
    expect(j.endDate).toBe('2027-03-06T11:00:00Z')
    expect(j.isAccessibleForFree).toBe(true)
    expect(j.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
    expect(j.location.address.streetAddress).toBe('1 Campus Road')
    expect(j.offers).toMatchObject({ price: '0', priceCurrency: 'NGN', availability: 'https://schema.org/InStock' })
    expect(j.url).toBe('https://www.example.test/events?event=intro-to-coding')
    expect(j.organizer['@id']).toBe('https://www.example.test/#organization')
  })

  it('marks a full event as sold out', () => {
    expect((campusEventJsonLd(event({ is_full: true }), ctx) as any).offers.availability).toBe('https://schema.org/SoldOut')
  })

  it('uses a virtual location for online events and never leaks a meeting link', () => {
    const j = campusEventJsonLd(event({ delivery_mode: 'online', location: 'Online' }), ctx) as any
    expect(j.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')
    expect(j.location).toEqual({ '@type': 'VirtualLocation', url: 'https://www.example.test/events' })
    expect(JSON.stringify(j)).not.toMatch(/meet\.google|zoom/)
  })

  it('combines a place and a virtual location for hybrid events', () => {
    const j = campusEventJsonLd(event({ delivery_mode: 'hybrid' }), ctx) as any
    expect(j.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode')
    expect(j.location).toHaveLength(2)
  })

  it('does not attach the campus street address to an off-campus venue', () => {
    const j = campusEventJsonLd(event({ location: 'Hotel Ballroom' }), ctx) as any
    expect(j.location.address.streetAddress).toBeUndefined()
    expect(j.location.address.addressLocality).toBe('Abeokuta')
  })

  it('writes a fallback description and omits endDate when absent', () => {
    const j = campusEventJsonLd(event({ description: '', ends_at: null }), ctx) as any
    expect(j.description).toMatch(/coding workshop/)
    expect('endDate' in j).toBe(false)
  })

  it('falls back to the id when there is no slug', () => {
    expect(eventPageUrl('https://x.test', { id: 'abc', slug: null })).toBe('https://x.test/events?event=abc')
  })
})

describe('campusEventsJsonLd', () => {
  it('skips events with invalid dates and caps the count', () => {
    const list = [event(), event({ id: '2', starts_at: 'not-a-date' }), event({ id: '3' })]
    expect(campusEventsJsonLd(list, ctx)).toHaveLength(2)
    expect(campusEventsJsonLd(list, ctx, 1)).toHaveLength(1)
    expect(campusEventsJsonLd([], ctx)).toEqual([])
  })
})
