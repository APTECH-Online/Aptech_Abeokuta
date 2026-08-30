import Link from 'next/link'
import { Download } from 'lucide-react'
import { getLeads, getLeadFilterOptions } from '../../../../lib/crm/leads'
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '../../../../types/db'
import StatusBadge from '../../../../components/admin/StatusBadge'
import Pagination from '../../../../components/admin/Pagination'

export const metadata = { title: 'Leads | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    search: sp.search,
    status: (sp.status as any) || '',
    programmeId: sp.programmeId,
    source: (sp.source as any) || '',
    assignedTo: sp.assignedTo,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    page,
    pageSize: 20
  }

  const [{ leads, total, pageSize }, { staff, programmes }] = await Promise.all([
    getLeads(filter),
    getLeadFilterOptions()
  ])

  const exportParams = new URLSearchParams()
  Object.entries(sp).forEach(([k, v]) => v && exportParams.set(k, v))

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Lead management</p>
          <h1 className="h-section mt-1">Leads</h1>
        </div>
        <a href={`/api/leads/export?${exportParams.toString()}`} className="btn btn-secondary btn-sm">
          <Download size={15} className="mr-1.5" aria-hidden="true" /> Export CSV
        </a>
      </div>

      <form className="card p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <label htmlFor="search" className="field-label">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={sp.search}
            placeholder="Name, email, phone, reference"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select w-full">
            <option value="">All statuses</option>
            {LEAD_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="programmeId" className="field-label">Programme</label>
          <select id="programmeId" name="programmeId" defaultValue={sp.programmeId || ''} className="admin-select w-full">
            <option value="">All programmes</option>
            {programmes.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="source" className="field-label">Source</label>
          <select id="source" name="source" defaultValue={sp.source || ''} className="admin-select w-full">
            <option value="">All sources</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="assignedTo" className="field-label">Assigned staff</label>
          <select id="assignedTo" name="assignedTo" defaultValue={sp.assignedTo || ''} className="admin-select w-full">
            <option value="">Anyone</option>
            {staff.map((s: any) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dateFrom" className="field-label">From</label>
          <input id="dateFrom" name="dateFrom" type="date" defaultValue={sp.dateFrom} className="admin-input w-full" />
        </div>
        <div>
          <label htmlFor="dateTo" className="field-label">To</label>
          <input id="dateTo" name="dateTo" type="date" defaultValue={sp.dateTo} className="admin-input w-full" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          <Link href="/admin/leads" className="btn btn-ghost btn-sm">Reset</Link>
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Programme</th>
              <th>Status</th>
              <th>Source</th>
              <th>Assigned</th>
              <th>Created</th>
              <th>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
                  No leads match these filters yet.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="is-clickable">
                  <td>
                    <Link href={`/admin/leads/${lead.id}`} className="font-mono text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>
                      {lead.lead_reference}
                    </Link>
                  </td>
                  <td className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    <Link href={`/admin/leads/${lead.id}`}>{lead.first_name} {lead.last_name}</Link>
                  </td>
                  <td>{lead.phone}</td>
                  <td className="truncate max-w-[180px]">{lead.email}</td>
                  <td>{lead.programmeName || '—'}</td>
                  <td><StatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} /></td>
                  <td>{LEAD_SOURCE_LABELS[lead.source]}</td>
                  <td>{lead.assignedName || 'Unassigned'}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{new Date(lead.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/leads" searchParams={sp} />
    </div>
  )
}
