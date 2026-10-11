import Link from 'next/link'
import { guardAdminPage } from '../../../../../lib/auth'
import { canDoEventsAction } from '../../../../../lib/events-access'
import EventForm from '../../../../../components/admin/EventForm'

export const metadata = { title: 'New event | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  await guardAdminPage((s) => canDoEventsAction(s, 'create'))
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/events" className="text-sm underline">← Back to events</Link>
        <p className="eyebrow mt-3">Community & lead generation</p>
        <h1 className="h-section mt-1">New event</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Times are in West Africa Time (WAT). The event appears on /events as soon as registration is open.</p>
      </div>
      <EventForm mode="create" />
    </div>
  )
}
