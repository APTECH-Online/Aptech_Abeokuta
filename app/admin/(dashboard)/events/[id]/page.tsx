import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guardAdminPage } from '../../../../../lib/auth'
import { canDoEventsAction } from '../../../../../lib/events-access'
import { getAdminEventById } from '../../../../../lib/crm/events'
import EventForm from '../../../../../components/admin/EventForm'
import { deleteEvent } from '../actions'

export const metadata = { title: 'Edit event | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await guardAdminPage((s) => canDoEventsAction(s, 'edit'))
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const event = await getAdminEventById(id)
  if (!event) notFound()

  const canDelete = canDoEventsAction(staff, 'delete') && event.registered === 0
  const canExport = canDoEventsAction(staff, 'export')

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/events" className="text-sm underline">← Back to events</Link>
        <p className="eyebrow mt-3">Community & lead generation</p>
        <h1 className="h-section mt-1">{event.title}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {event.registered} registered{event.capacity ? ` of ${event.capacity} places` : ''} · {event.attended} attended
          {canExport && event.registered > 0 && <> · <a className="underline" href={`/api/admin/events/export?event=${event.id}`}>Download registrations (CSV)</a></>}
        </p>
      </div>
      <EventForm mode="edit" event={event} />
      {canDelete && (
        <form action={deleteEvent} className="max-w-2xl border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
          <input type="hidden" name="id" value={event.id} />
          <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>Nobody has registered, so this event can be deleted permanently.</p>
          <button type="submit" className="btn btn-secondary btn-sm">Delete event</button>
        </form>
      )}
    </div>
  )
}
