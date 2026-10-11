/** Date/calendar helpers for event emails and confirmation screens. All times are WAT (Africa/Lagos, UTC+1, no DST). */

const WAT = 'Africa/Lagos'
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/** "Saturday, 24 October 2026, 10:00 AM – 12:00 PM WAT" */
export function formatEventWhen(startsAt: string, endsAt?: string | null): string {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return ''
  const date = new Intl.DateTimeFormat('en-NG', { timeZone: WAT, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start)
  const time = (d: Date) => new Intl.DateTimeFormat('en-NG', { timeZone: WAT, hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(/\s?([ap])m$/i, (_m, x: string) => ` ${x.toUpperCase()}M`)
  const end = endsAt ? new Date(endsAt) : null
  const range = end && !Number.isNaN(end.getTime()) ? `${time(start)} – ${time(end)}` : time(start)
  return `${date}, ${range} WAT`
}

const calendarStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

export function googleCalendarUrl(event: {
  title: string
  startsAt: string
  endsAt?: string | null
  location?: string | null
  details?: string | null
}): string | null {
  const start = new Date(event.startsAt)
  if (Number.isNaN(start.getTime())) return null
  const parsedEnd = event.endsAt ? new Date(event.endsAt) : null
  const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start ? parsedEnd : new Date(start.getTime() + TWO_HOURS_MS)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`
  })
  if (event.details) params.set('details', event.details)
  if (event.location) params.set('location', event.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
