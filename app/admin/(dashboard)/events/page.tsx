import Link from 'next/link'
import { Plus } from 'lucide-react'
import { guardAdminPage } from '../../../../lib/auth'
import { canDoEventsAction } from '../../../../lib/events-access'
import { getAdminEvents, getEventFollowUpTasks, getRegistrations } from '../../../../lib/crm/events'
import { EVENT_TYPE_LABELS } from '../../../../lib/event-admin'
import Pagination from '../../../../components/admin/Pagination'
import { setRegistrationOpen, updateEventRegistration } from './actions'

export const metadata = { title: 'Events & Registrations | Admissions CRM' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25
const wat = (iso: string) => new Date(iso).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })
const border = { borderColor: 'var(--color-border)' }
const muted = { color: 'var(--color-muted)' }

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await guardAdminPage((s) => canDoEventsAction(s, 'view'))
  const canCreate = canDoEventsAction(staff, 'create')
  const canEdit = canDoEventsAction(staff, 'edit')
  const canExport = canDoEventsAction(staff, 'export')

  const sp = await searchParams
  const page = Math.max(Number(sp.page) || 1, 1)
  const eventFilter = sp.event && /^[0-9a-f-]{36}$/i.test(sp.event) ? sp.event : ''
  const search = (sp.q || '').slice(0, 80)

  const [events, { rows: registrations, total }, tasks] = await Promise.all([
    getAdminEvents(),
    getRegistrations({ eventId: eventFilter || undefined, search, page, pageSize: PAGE_SIZE }),
    getEventFollowUpTasks()
  ])
  const exportHref = `/api/admin/events/export${eventFilter ? `?event=${eventFilter}` : ''}`

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Community & lead generation</p>
          <h1 className="h-section mt-1">Workshops & campus events</h1>
          <p className="text-sm mt-2" style={muted}>
            Public registration page: <Link className="underline" href="/events">/events</Link>. Every registration creates or updates a lead in Enquiries.
          </p>
        </div>
        {canCreate && (
          <Link href="/admin/events/new" className="btn btn-primary inline-flex items-center gap-2">
            <Plus size={16} aria-hidden="true" /> New event
          </Link>
        )}
      </header>

      <section className="card p-5">
        <h2 className="font-semibold text-lg">Events</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Date (WAT)</th>
                <th className="py-2 pr-4">Registered</th>
                <th className="py-2 pr-4">Registration</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const full = e.capacity !== null && e.registered >= e.capacity
                return (
                  <tr key={e.id} className="border-t" style={border}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs" style={muted}>{EVENT_TYPE_LABELS[e.event_type as keyof typeof EVENT_TYPE_LABELS] ?? e.event_type}</p>
                    </td>
                    <td className="py-3 pr-4">{wat(e.starts_at)}</td>
                    <td className="py-3 pr-4">
                      {e.registered}{e.capacity ? ` / ${e.capacity}` : ''}
                      {full && <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>Full</span>}
                    </td>
                    <td className="py-3 pr-4">{e.registration_open ? 'Open' : 'Closed'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {canEdit && <Link className="underline" href={`/admin/events/${e.id}`}>Edit</Link>}
                        <Link className="underline" href={`/admin/events?event=${e.id}`}>Registrations</Link>
                        {canEdit && (
                          <form action={setRegistrationOpen}>
                            <input type="hidden" name="id" value={e.id} />
                            <input type="hidden" name="open" value={e.registration_open ? 'false' : 'true'} />
                            <button type="submit" className="underline">{e.registration_open ? 'Close' : 'Reopen'}</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {events.length === 0 && (
            <p className="py-4 text-sm">
              No events yet.{canCreate && <> <Link href="/admin/events/new" className="underline">Create the first one</Link>.</>}
            </p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">Registrations & outcomes <span className="text-sm font-normal" style={muted}>({total})</span></h2>
          {canExport && total > 0 && <a href={exportHref} className="btn btn-secondary btn-sm">Download CSV</a>}
        </div>

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">Event
            <select name="event" defaultValue={eventFilter} className="form-input mt-1">
              <option value="">All events</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </label>
          <label className="text-sm">Search
            <input name="q" defaultValue={search} placeholder="Name, email or phone" className="form-input mt-1" />
          </label>
          <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
          {(eventFilter || search) && <Link href="/admin/events" className="text-sm underline">Clear</Link>}
        </form>

        <div className="grid gap-4 mt-4">
          {registrations.map((r) => (
            <form action={updateEventRegistration} key={r.id} className="rounded-xl border p-4 grid gap-3 lg:grid-cols-[1fr_180px_210px_auto] items-end" style={border}>
              <input type="hidden" name="id" value={r.id} />
              <div>
                <p className="font-semibold">
                  {r.lead_id ? <Link className="underline" href={`/admin/leads/${r.lead_id}`}>{r.full_name}</Link> : r.full_name}
                </p>
                <p className="text-sm">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
                <p className="text-xs mt-1" style={muted}>
                  {r.campus_events?.title || 'Event'} · Interest: {r.interest} · Contact by: {r.preferred_contact} · Registered {wat(r.registered_at)}
                </p>
              </div>
              <label className="text-sm">Attendance
                <select name="attendance_status" defaultValue={r.attendance_status} disabled={!canEdit} className="form-input mt-1">
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="no_show">No-show</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="text-sm">Inquiry outcome
                <select name="inquiry_outcome" defaultValue={r.inquiry_outcome} disabled={!canEdit} className="form-input mt-1">
                  <option value="not_recorded">Not recorded</option>
                  <option value="interested">Interested</option>
                  <option value="requested_counselling">Requested counselling</option>
                  <option value="application_started">Application started</option>
                  <option value="not_interested">Not interested</option>
                  <option value="no_follow_up_needed">No follow-up needed</option>
                </select>
              </label>
              {canEdit && <button className="btn btn-secondary btn-sm" type="submit">Save outcome</button>}
            </form>
          ))}
          {registrations.length === 0 && <p className="text-sm py-4">No registrations found.</p>}
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/events" searchParams={{ event: eventFilter || undefined, q: search || undefined }} />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-lg">Automatically created follow-up tasks</h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">Task</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t" style={border}>
                  <td className="py-3 pr-4">{t.title}</td>
                  <td className="py-3 pr-4">{wat(t.due_at)}</td>
                  <td className="py-3">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="py-3 text-sm">Tasks will appear when attendance and inquiry outcomes are recorded.</p>}
        </div>
      </section>
    </div>
  )
}
