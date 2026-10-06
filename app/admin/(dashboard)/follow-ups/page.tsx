import Link from 'next/link'
import { guardAdminPage } from '../../../../lib/auth'
import { hasAnyModulePermission, hasPermission } from '../../../../lib/permissions'
import { getFollowUps } from '../../../../lib/crm/follow-ups'
import { FOLLOW_UP_STATUS_LABELS, INTERACTION_TYPE_LABELS } from '../../../../types/db'
import StatusBadge from '../../../../components/admin/StatusBadge'
import FollowUpStatusForm from '../../../../components/admin/FollowUpStatusForm'
import Pagination from '../../../../components/admin/Pagination'
import { DeleteFollowUpButton } from '../../../../components/admin/CrmDeleteActions'

export const metadata = { title: 'Follow-ups | Admissions CRM' }
export const dynamic = 'force-dynamic'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function FollowUpsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const currentStaff = await guardAdminPage((s) => s.role === 'super_admin' || s.role === 'admissions_officer' || hasAnyModulePermission(s, 'follow_ups'))
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const [{ followUps, total, pageSize }] = await Promise.all([
    getFollowUps({
    status: (sp.status as any) || '',
    page,
    pageSize: 25
  })
  ])
  const canDelete = currentStaff.role === 'super_admin' || hasPermission(currentStaff, 'follow_ups.delete')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Admissions</p>
        <h1 className="h-section mt-1">Follow-ups</h1>
      </div>

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select">
            <option value="">All</option>
            {Object.entries(FOLLOW_UP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/follow-ups" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table is-stackable">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Due</th>
              <th>Type</th>
              <th>Assigned</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Action</th>
              {canDelete && <th>Admin</th>}
            </tr>
          </thead>
          <tbody>
            {followUps.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 8 : 7} className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
                  No follow-ups match this filter.
                </td>
              </tr>
            ) : (
              followUps.map((f: any) => (
                <tr key={f.id}>
                  <td data-label="Lead" data-primary className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    {f.leads ? <Link href={`/admin/leads/${f.leads.id}`}>{f.leads.first_name} {f.leads.last_name}</Link> : '—'}
                  </td>
                  <td data-label="Due" style={{ color: f.isOverdue ? 'var(--color-danger)' : undefined }}>
                    {f.isOverdue && <span className="font-semibold">Overdue · </span>}
                    {formatDateTime(f.due_date)}
                  </td>
                  <td data-label="Type">{INTERACTION_TYPE_LABELS[f.type as keyof typeof INTERACTION_TYPE_LABELS]}</td>
                  <td data-label="Assigned">{f.staff?.full_name || 'Unassigned'}</td>
                  <td data-label="Status"><StatusBadge status={f.isOverdue ? 'overdue' : f.status} label={f.isOverdue ? 'Overdue' : FOLLOW_UP_STATUS_LABELS[f.status as keyof typeof FOLLOW_UP_STATUS_LABELS]} /></td>
                  <td data-label="Notes" className="max-w-[220px] truncate">{f.notes || '—'}</td>
                  <td data-label="Action">
                    {f.status === 'pending' && <FollowUpStatusForm followUpId={f.id} leadId={f.lead_id} />}
                  </td>
                  {canDelete && (
                    <td data-label="Admin">
                      <DeleteFollowUpButton followUpId={f.id} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/follow-ups" searchParams={sp} />
    </div>
  )
}
