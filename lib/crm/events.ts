import 'server-only'
import { createAdminClient } from '../supabase/admin'

export interface AdminEvent {
  id: string
  title: string
  slug: string
  event_type: string
  description: string
  starts_at: string
  ends_at: string | null
  location: string
  delivery_mode: string
  meeting_url: string | null
  capacity: number | null
  registration_open: boolean
  registered: number
  attended: number
}

const EVENT_COLUMNS = 'id,title,slug,event_type,description,starts_at,ends_at,location,delivery_mode,meeting_url,capacity,registration_open'

/** Callers must have passed requireEventsAccess/guardAdminPage first: this uses the service-role client. */
export async function getAdminEvents(): Promise<AdminEvent[]> {
  const db = createAdminClient()
  const [{ data: events }, { data: regs }] = await Promise.all([
    db.from('campus_events').select(EVENT_COLUMNS).order('starts_at', { ascending: false }).limit(200),
    db.from('event_registrations').select('event_id,attendance_status').limit(20000)
  ])
  const counts = new Map<string, { registered: number; attended: number }>()
  for (const r of (regs ?? []) as Array<{ event_id: string; attendance_status: string }>) {
    const c = counts.get(r.event_id) ?? { registered: 0, attended: 0 }
    if (r.attendance_status !== 'cancelled') c.registered += 1
    if (r.attendance_status === 'attended') c.attended += 1
    counts.set(r.event_id, c)
  }
  return ((events ?? []) as Omit<AdminEvent, 'registered' | 'attended'>[]).map((e) => ({
    ...e,
    registered: counts.get(e.id)?.registered ?? 0,
    attended: counts.get(e.id)?.attended ?? 0
  }))
}

export async function getAdminEventById(id: string): Promise<AdminEvent | null> {
  const db = createAdminClient()
  const { data: event } = await db.from('campus_events').select(EVENT_COLUMNS).eq('id', id).maybeSingle()
  if (!event) return null
  const { data: regs } = await db.from('event_registrations').select('attendance_status').eq('event_id', id).limit(20000)
  const rows = (regs ?? []) as Array<{ attendance_status: string }>
  return {
    ...(event as Omit<AdminEvent, 'registered' | 'attended'>),
    registered: rows.filter((r) => r.attendance_status !== 'cancelled').length,
    attended: rows.filter((r) => r.attendance_status === 'attended').length
  }
}

export interface RegistrationRow {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string | null
  interest: string
  preferred_contact: string
  marketing_consent: boolean
  attendance_status: string
  inquiry_outcome: string
  registered_at: string
  lead_id: string | null
  campus_events: { title: string; starts_at: string } | null
}

export const REGISTRATION_COLUMNS =
  'id,event_id,full_name,email,phone,interest,preferred_contact,marketing_consent,attendance_status,inquiry_outcome,registered_at,lead_id,campus_events(title,starts_at)'

/** Removes characters that have meaning inside a PostgREST `or()` filter or an ILIKE pattern. */
export function sanitizeSearch(input: string): string {
  return input.replace(/[%_,()\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export async function getRegistrations(filter: { eventId?: string; search?: string; page: number; pageSize: number }) {
  const db = createAdminClient()
  const from = (Math.max(filter.page, 1) - 1) * filter.pageSize
  let query = db
    .from('event_registrations')
    .select(REGISTRATION_COLUMNS, { count: 'exact' })
    .order('registered_at', { ascending: false })
    .range(from, from + filter.pageSize - 1)
  if (filter.eventId) query = query.eq('event_id', filter.eventId)
  const search = sanitizeSearch(filter.search ?? '')
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data, count } = await query
  return { rows: (data ?? []) as unknown as RegistrationRow[], total: count ?? 0 }
}

export async function getEventFollowUpTasks() {
  const db = createAdminClient()
  const { data } = await db.from('event_follow_up_tasks').select('id,title,status,due_at,task_type').order('due_at').limit(100)
  return (data ?? []) as Array<{ id: string; title: string; status: string; due_at: string; task_type: string }>
}
