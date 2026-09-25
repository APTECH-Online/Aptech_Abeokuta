import { requireRole } from '../../../../lib/auth'
import { createClient } from '../../../../lib/supabase/server'
import { getNotificationsForStaff } from '../../../../lib/notifications'
import NotificationsList from '../../../../components/admin/NotificationsList'

export const metadata = { title: 'Notifications | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const staff = await requireRole('super_admin')
  const supabase = await createClient()
  const notifications = await getNotificationsForStaff(supabase, staff)

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Official Account</p>
        <h1 className="h-section mt-1">Notifications</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          New enquiries, applications, and overdue follow-ups — everything lives here, no email required.
        </p>
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  )
}
