import { createClient } from '../../../../lib/supabase/server'
import { requireStaff } from '../../../../lib/auth'
import { type Staff } from '../../../../types/db'
import { InviteStaffForm, StaffRow } from '../../../../components/admin/StaffForms'

export const metadata = { title: 'Staff | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const currentStaff = await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: true })
  const staffList = (data ?? []) as Staff[]

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Official Account</p>
        <h1 className="h-section mt-1">Staff management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Manage who has access to the CRM and what they&apos;re authorized to do.
        </p>
      </div>

      {currentStaff.role === 'super_admin' ? (
        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Staff &amp; roles</p>
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
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Staff account management is available to Super Admins only.
        </p>
      )}
    </div>
  )
}
