import { createClient } from '../../../../lib/supabase/server'
import { requireRole } from '../../../../lib/auth'
import { type Staff } from '../../../../types/db'
import { AddStaffForm, StaffCard, StaffRow } from '../../../../components/admin/StaffForms'

export const metadata = { title: 'Staff | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const currentStaff = await requireRole('super_admin')
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
            <AddStaffForm />
          </div>
          {/* Table view: md screens and up. Below md, a stacked card layout
              (right below) takes over so the permissions/role/password
              controls never get cramped or force horizontal scrolling on
              small screens. */}
          <div className="admin-table-wrap hidden md:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned permissions</th>
                  <th>Status</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <StaffRow key={member.id} member={member} isSelf={member.id === currentStaff.id} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="staff-cards md:hidden">
            {staffList.map((member) => (
              <StaffCard key={member.id} member={member} isSelf={member.id === currentStaff.id} />
            ))}
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
