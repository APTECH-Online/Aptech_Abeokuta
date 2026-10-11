import { z } from 'zod'

/** Validation + helpers for the CRM's create/edit event form. Pure, so it is unit-tested. */

export const EVENT_TYPE_VALUES = ['coding_workshop', 'webinar', 'career_talk', 'demonstration', 'open_day', 'campus_event'] as const
export const DELIVERY_MODE_VALUES = ['in_person', 'online', 'hybrid'] as const

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPE_VALUES)[number], string> = {
  coding_workshop: 'Coding workshop',
  webinar: 'Webinar',
  career_talk: 'Career talk',
  demonstration: 'Live demonstration',
  open_day: 'Open day',
  campus_event: 'Campus event'
}

export const DELIVERY_MODE_LABELS: Record<(typeof DELIVERY_MODE_VALUES)[number], string> = {
  in_person: 'On campus',
  online: 'Online',
  hybrid: 'Campus + online'
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** Nigeria is UTC+1 all year (no daylight saving), so WAT conversion is a fixed offset. */
const WAT_OFFSET = '+01:00'
const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/** "2026-10-24T10:00" typed in WAT -> UTC ISO string, or null if invalid. */
export function watLocalToIso(local: string): string | null {
  if (!LOCAL_DATETIME.test(local)) return null
  const date = new Date(`${local}:00${WAT_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** UTC ISO string -> "2026-10-24T10:00" in WAT, for <input type="datetime-local">. */
export function isoToWatLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

const text = (max: number) => z.string().trim().max(max)

const formSchema = z.object({
  title: text(160).min(3, 'Enter a title of at least 3 characters.'),
  slug: text(90)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only.')
    .default(''),
  event_type: z.enum(EVENT_TYPE_VALUES, { error: 'Choose an event type.' }),
  description: text(2000).default(''),
  starts_at: z.string().trim().min(1, 'Choose a start date and time.'),
  ends_at: z.string().trim().default(''),
  location: text(200).default(''),
  delivery_mode: z.enum(DELIVERY_MODE_VALUES, { error: 'Choose how the event is delivered.' }),
  meeting_url: text(500).default(''),
  capacity: z.string().trim().default(''),
  registration_open: z.boolean().default(false)
})

export interface ParsedEventForm {
  title: string
  slug: string
  event_type: (typeof EVENT_TYPE_VALUES)[number]
  description: string
  starts_at: string
  ends_at: string | null
  location: string
  delivery_mode: (typeof DELIVERY_MODE_VALUES)[number]
  meeting_url: string | null
  capacity: number | null
  registration_open: boolean
}

export type ParseEventFormResult =
  | { ok: true; data: ParsedEventForm }
  | { ok: false; fieldErrors: Record<string, string> }

export function parseEventForm(
  raw: Record<string, FormDataEntryValue | boolean | null | undefined>,
  options: { requireFuture?: boolean; now?: Date } = {}
): ParseEventFormResult {
  const input = {
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    event_type: raw.event_type ?? '',
    description: raw.description ?? '',
    starts_at: raw.starts_at ?? '',
    ends_at: raw.ends_at ?? '',
    location: raw.location ?? '',
    delivery_mode: raw.delivery_mode ?? '',
    meeting_url: raw.meeting_url ?? '',
    capacity: raw.capacity ?? '',
    registration_open: raw.registration_open === 'on' || raw.registration_open === true
  }
  const parsed = formSchema.safeParse(input)
  const fieldErrors: Record<string, string> = {}

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
  }
  if (!parsed.success) return { ok: false, fieldErrors }

  const v = parsed.data
  const startsAt = watLocalToIso(v.starts_at)
  if (!startsAt) fieldErrors.starts_at = 'Enter a valid start date and time.'
  else if (options.requireFuture && new Date(startsAt) <= (options.now ?? new Date())) {
    fieldErrors.starts_at = 'The start time must be in the future.'
  }

  let endsAt: string | null = null
  if (v.ends_at) {
    endsAt = watLocalToIso(v.ends_at)
    if (!endsAt) fieldErrors.ends_at = 'Enter a valid end date and time.'
    else if (startsAt && new Date(endsAt) <= new Date(startsAt)) fieldErrors.ends_at = 'The end time must be after the start time.'
  }

  let meetingUrl: string | null = null
  if (v.meeting_url) {
    try {
      const url = new URL(v.meeting_url)
      if (url.protocol !== 'https:') throw new Error('not https')
      meetingUrl = url.toString()
    } catch {
      fieldErrors.meeting_url = 'Enter a full https:// link, for example a Google Meet or Zoom URL.'
    }
  } else if (v.delivery_mode === 'online') {
    fieldErrors.meeting_url = 'Online events need a meeting link so registrants can join.'
  }

  let capacity: number | null = null
  if (v.capacity) {
    const n = Number(v.capacity)
    if (!Number.isInteger(n) || n < 1 || n > 100000) fieldErrors.capacity = 'Enter a whole number of places (1 or more), or leave blank for no limit.'
    else capacity = n
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  return {
    ok: true,
    data: {
      title: v.title,
      slug: v.slug || slugify(v.title),
      event_type: v.event_type,
      description: v.description,
      starts_at: startsAt as string,
      ends_at: endsAt,
      location: v.location || (v.delivery_mode === 'online' ? 'Online' : 'APTECH Abeokuta'),
      delivery_mode: v.delivery_mode,
      meeting_url: meetingUrl,
      capacity,
      registration_open: v.registration_open
    }
  }
}
