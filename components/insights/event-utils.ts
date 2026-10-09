/**
 * Event date/time helpers shared by the upcoming-event cards and the event
 * detail page. Everything is formatted in Africa/Lagos (WAT) explicitly —
 * server renders run in UTC, so un-pinned toLocale* calls can show an event an
 * hour (or a day, near midnight) off for visitors in Abeokuta.
 */
const TZ = 'Africa/Lagos'

const fmt = (opts: Intl.DateTimeFormatOptions, locale = 'en-GB') => new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts })

export type EventParts = { weekday: string; weekdayLong: string; day: string; month: string; monthLong: string; year: string; dateLong: string; dateShort: string }

export function eventParts(iso: string): EventParts {
  const d = new Date(iso)
  return {
    weekday: fmt({ weekday: 'short' }).format(d),
    weekdayLong: fmt({ weekday: 'long' }).format(d),
    day: fmt({ day: 'numeric' }).format(d),
    month: fmt({ month: 'short' }).format(d),
    monthLong: fmt({ month: 'long' }).format(d),
    year: fmt({ year: 'numeric' }).format(d),
    dateLong: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d),
    dateShort: fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  }
}

export function eventTime(iso: string): string {
  return fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, 'en-US').format(new Date(iso))
}

const dayKey = (d: Date) => fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA').format(d)

export function sameLagosDay(a: string, b: string): boolean {
  return dayKey(new Date(a)) === dayKey(new Date(b))
}

/** "10:00 AM – 12:30 PM" for a same-day event, "10:00 AM" without an end time. */
export function timeRange(start: string, end?: string | null): string {
  if (!end || !sameLagosDay(start, end)) return eventTime(start)
  return `${eventTime(start)} – ${eventTime(end)}`
}

export type EventStatus = { key: 'live' | 'today' | 'tomorrow' | 'soon' | 'upcoming' | 'ended'; label: string }

export function eventStatus(start: string | null, end: string | null, now = new Date()): EventStatus | null {
  if (!start) return null
  const s = new Date(start)
  const e = end ? new Date(end) : null
  if (now > (e ?? s)) return { key: 'ended', label: 'Event ended' }
  if (e && now >= s) return { key: 'live', label: 'Happening now' }
  const toUtcDay = (d: Date) => { const [y, m, dd] = dayKey(d).split('-').map(Number); return Date.UTC(y, m - 1, dd) }
  const diff = Math.round((toUtcDay(s) - toUtcDay(now)) / 86_400_000)
  if (diff <= 0) return { key: 'today', label: 'Today' }
  if (diff === 1) return { key: 'tomorrow', label: 'Tomorrow' }
  if (diff <= 14) return { key: 'soon', label: `In ${diff} days` }
  return { key: 'upcoming', label: 'Upcoming' }
}

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')

type CalInput = { title: string; start: string; end?: string | null; venue?: string | null; description?: string | null; url: string }

function calRange({ start, end }: CalInput) {
  const s = new Date(start)
  const e = end ? new Date(end) : new Date(s.getTime() + 60 * 60 * 1000)
  return { s, e }
}

export function googleCalendarUrl(input: CalInput): string {
  const { s, e } = calRange(input)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${icsStamp(s)}/${icsStamp(e)}`,
    details: [input.description, input.url].filter(Boolean).join('\n\n'),
    ...(input.venue ? { location: input.venue } : {})
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

const icsEscape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function icsDataUri(input: CalInput & { uid: string }): string {
  const { s, e } = calRange(input)
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//APTECH Abeokuta//Events//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${input.uid}@aptech-abeokuta`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(s)}`, `DTEND:${icsStamp(e)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    ...(input.venue ? [`LOCATION:${icsEscape(input.venue)}`] : []),
    `DESCRIPTION:${icsEscape([input.description, input.url].filter(Boolean).join('\n\n'))}`,
    `URL:${input.url}`, 'END:VEVENT', 'END:VCALENDAR'
  ]
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

/** Turns a free-text contact into a tappable mailto:/tel: link when it clearly is one. */
export function contactHref(contact: string): string | null {
  const c = contact.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`
  const digits = c.replace(/[^\d+]/g, '')
  if (/^\+?\d{7,15}$/.test(digits) && /^[\d\s+()\-.]+$/.test(c)) return `tel:${digits}`
  return null
}

export const mapsSearchUrl = (venue: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
