/**
 * schema.org Event markup for the /events page: one Event per upcoming, open session.
 *
 * Pure (no database or server imports) so it is unit-tested. Rules, matching
 * lib/structured-data.ts: only claim what the visible page also shows. Sessions are
 * free (the page says so), so each carries a zero-price Offer; the private
 * `meeting_url` is never published, online sessions point at the public events page.
 */

export interface JsonLdCampusEvent {
  id: string
  title: string
  slug: string | null
  event_type: string | null
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  delivery_mode: string | null
  is_full?: boolean
}

export interface EventJsonLdContext {
  baseUrl: string
  organizer: Record<string, unknown>
  imageUrl: string
  /** Campus street address; attached to venues that are the campus itself. */
  campusAddress?: { streetAddress: string; addressLocality: string; addressRegion: string; addressCountry: string } | null
}

const TYPE_NAMES: Record<string, string> = {
  coding_workshop: 'coding workshop',
  webinar: 'webinar',
  career_talk: 'career talk',
  demonstration: 'live demonstration',
  open_day: 'open day',
  campus_event: 'campus event'
}

const ATTENDANCE_MODE: Record<string, string> = {
  in_person: 'https://schema.org/OfflineEventAttendanceMode',
  online: 'https://schema.org/OnlineEventAttendanceMode',
  hybrid: 'https://schema.org/MixedEventAttendanceMode'
}

export function eventPageUrl(baseUrl: string, event: Pick<JsonLdCampusEvent, 'id' | 'slug'>): string {
  return `${baseUrl}/events?event=${encodeURIComponent(event.slug || event.id)}`
}

export function campusEventJsonLd(event: JsonLdCampusEvent, ctx: EventJsonLdContext) {
  const mode = event.delivery_mode && ATTENDANCE_MODE[event.delivery_mode] ? event.delivery_mode : 'in_person'
  const url = eventPageUrl(ctx.baseUrl, event)
  const venueName = event.location?.trim() || 'APTECH Abeokuta'
  const atCampus = /aptech|campus/i.test(venueName)

  const place = {
    '@type': 'Place',
    name: venueName,
    address:
      atCampus && ctx.campusAddress
        ? { '@type': 'PostalAddress', ...ctx.campusAddress }
        : { '@type': 'PostalAddress', addressLocality: 'Abeokuta', addressRegion: 'Ogun State', addressCountry: 'NG' }
  }
  const virtual = { '@type': 'VirtualLocation', url: `${ctx.baseUrl}/events` }
  const location = mode === 'online' ? virtual : mode === 'hybrid' ? [place, virtual] : place

  const typeName = TYPE_NAMES[event.event_type ?? ''] ?? 'event'
  const description =
    event.description?.trim() || `Free ${typeName} hosted by APTECH Abeokuta. Register online to reserve your place.`

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description,
    url,
    image: [ctx.imageUrl],
    startDate: event.starts_at,
    ...(event.ends_at ? { endDate: event.ends_at } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: ATTENDANCE_MODE[mode],
    isAccessibleForFree: true,
    location,
    organizer: ctx.organizer,
    offers: {
      '@type': 'Offer',
      url,
      price: '0',
      priceCurrency: 'NGN',
      availability: event.is_full ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'
    }
  }
}

/** One Event per session (capped), or an empty array when nothing qualifies. */
export function campusEventsJsonLd(events: JsonLdCampusEvent[], ctx: EventJsonLdContext, max = 20) {
  return events
    .filter((e) => e.title && !Number.isNaN(new Date(e.starts_at).getTime()))
    .slice(0, max)
    .map((e) => campusEventJsonLd(e, ctx))
}
