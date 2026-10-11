import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '../../../../../lib/auth'
import { canDoEventsAction } from '../../../../../lib/events-access'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { logAudit } from '../../../../../lib/audit'
import { toCsv } from '../../../../../lib/csv'
import { formatEventWhen } from '../../../../../lib/event-calendar'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const wat = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })

/** GET /api/admin/events/export[?event=<uuid>]: registrations as CSV (all events, or one). */
export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDoEventsAction(staff, 'export')) return NextResponse.json({ error: 'You do not have permission to export registrations.' }, { status: 403 })

  const eventId = request.nextUrl.searchParams.get('event') || ''
  if (eventId && !UUID.test(eventId)) return NextResponse.json({ error: 'Invalid event.' }, { status: 400 })

  const db = createAdminClient()
  let query = db
    .from('event_registrations')
    .select('full_name,email,phone,interest,preferred_contact,marketing_consent,attendance_status,inquiry_outcome,registered_at,leads(lead_reference),campus_events(title,starts_at,ends_at)')
    .order('registered_at', { ascending: true })
    .limit(20000)
  if (eventId) query = query.eq('event_id', eventId)
  const { data, error } = await query
  if (error) {
    console.error('[events] export failed', error)
    return NextResponse.json({ error: 'Could not export registrations.' }, { status: 500 })
  }

  type Row = {
    full_name: string; email: string; phone: string | null; interest: string; preferred_contact: string
    marketing_consent: boolean; attendance_status: string; inquiry_outcome: string; registered_at: string
    leads: { lead_reference: string } | { lead_reference: string }[] | null
    campus_events: { title: string; starts_at: string; ends_at: string | null } | { title: string; starts_at: string; ends_at: string | null }[] | null
  }
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)

  const rows = ((data ?? []) as unknown as Row[]).map((r) => {
    const event = first(r.campus_events)
    return [
      event?.title ?? '',
      event ? formatEventWhen(event.starts_at, event.ends_at) : '',
      r.full_name,
      r.email,
      r.phone ?? '',
      r.interest,
      r.preferred_contact,
      r.marketing_consent ? 'Yes' : 'No',
      r.attendance_status,
      r.inquiry_outcome,
      first(r.leads)?.lead_reference ?? '',
      wat(r.registered_at)
    ]
  })

  const csv = toCsv([
    ['Event', 'Event date', 'Name', 'Email', 'Phone', 'Interest', 'Preferred contact', 'Marketing consent', 'Attendance', 'Inquiry outcome', 'Lead reference', 'Registered (WAT)'],
    ...rows
  ])

  await logAudit(db, { userId: staff.id, action: 'event_registrations.exported', entity: 'event', entityId: eventId || null, metadata: { count: rows.length } })

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store'
    }
  })
}
