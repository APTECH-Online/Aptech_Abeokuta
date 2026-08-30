import Link from 'next/link'
import { getApplications } from '../../../../lib/crm/applications'
import { APPLICATION_STATUS_LABELS } from '../../../../types/db'
import StatusBadge from '../../../../components/admin/StatusBadge'
import ApplicationStatusForm from '../../../../components/admin/ApplicationStatusForm'
import Pagination from '../../../../components/admin/Pagination'

export const metadata = { title: 'Applications | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const { applications, total, pageSize } = await getApplications({
    status: (sp.status as any) || '',
    programmeId: sp.programmeId,
    page,
    pageSize: 20
  })

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Admissions</p>
        <h1 className="h-section mt-1">Applications</h1>
      </div>

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select">
            <option value="">All statuses</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/applications" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Applicant</th>
              <th>Programme</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Assigned</th>
              <th>Update status</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
                  No applications yet.
                </td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>{a.application_reference}</td>
                  <td className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    {a.leads ? (
                      <Link href={`/admin/leads/${a.leads.id}`}>{a.leads.first_name} {a.leads.last_name}</Link>
                    ) : '—'}
                  </td>
                  <td>{a.programmes?.name || '—'}</td>
                  <td><StatusBadge status={a.status} label={APPLICATION_STATUS_LABELS[a.status as keyof typeof APPLICATION_STATUS_LABELS]} /></td>
                  <td>{new Date(a.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{a.staff?.full_name || 'Unassigned'}</td>
                  <td>
                    <ApplicationStatusForm applicationId={a.id} leadId={a.leads?.id || ''} currentStatus={a.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/applications" searchParams={sp} />
    </div>
  )
}
