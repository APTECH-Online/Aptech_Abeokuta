import { STAFF_ROLE_LABELS } from '../../../../types/db'
import { requireStaff } from '../../../../lib/auth'
import StatusBadge from '../../../../components/admin/StatusBadge'

export const metadata = { title: 'Settings | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const currentStaff = await requireStaff()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="h-section mt-1">Settings</h1>
      </div>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-3">Your account</p>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{currentStaff.full_name}</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{currentStaff.email}</p>
          </div>
          <StatusBadge status={currentStaff.role} label={STAFF_ROLE_LABELS[currentStaff.role]} />
        </div>
      </section>

      {currentStaff.role === 'super_admin' && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Looking to invite or manage staff accounts? That&apos;s now under{' '}
          <a href="/admin/staff" className="font-semibold underline" style={{ color: 'var(--color-ink)' }}>
            Staff
          </a>{' '}
          in the sidebar.
        </p>
      )}
    </div>
  )
}
