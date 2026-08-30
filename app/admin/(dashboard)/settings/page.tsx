import { createClient } from '../../../../lib/supabase/server'
import { requireStaff } from '../../../../lib/auth'
import { STAFF_ROLE_LABELS, type Staff } from '../../../../types/db'
import { InviteStaffForm, StaffRow } from '../../../../components/admin/StaffForms'
import StatusBadge from '../../../../components/admin/StatusBadge'

export const metadata = { title: 'Settings | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const currentStaff = await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: true })
  const staffList = (data ?? []) as Staff[]

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
        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Staff & roles</p>
            <InviteStaffForm />
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <StaffRow key={member.id} member={member} isSelf={member.id === currentStaff.id} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {currentStaff.role !== 'super_admin' && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Staff account management is available to Super Admins only.
        </p>
      )}
    </div>
  )
}
