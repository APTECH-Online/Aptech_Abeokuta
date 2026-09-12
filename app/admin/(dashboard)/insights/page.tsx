import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireStaff, canManageInsights } from '../../../../lib/auth'
import { getInsights } from '../../../../lib/crm/insights'
import {
  INSIGHT_STATUS_LABELS,
  INSIGHT_CONTENT_TYPE_LABELS,
  INSIGHT_CONTENT_TYPE_ORDER,
  INSIGHT_CATEGORIES,
  type InsightStatus
} from '../../../../types/db'
import StatusBadge from '../../../../components/admin/StatusBadge'
import Pagination from '../../../../components/admin/Pagination'
import InsightRowActions from '../../../../components/admin/InsightRowActions'

export const metadata = { title: 'Insights | Admissions CRM' }
export const dynamic = 'force-dynamic'

const TABS: { key: string; label: string; status?: InsightStatus; contentType?: 'event' }[] = [
  { key: 'all', label: 'All Insights' },
  { key: 'draft', label: 'Drafts', status: 'draft' },
  { key: 'scheduled', label: 'Scheduled', status: 'scheduled' },
  { key: 'published', label: 'Published', status: 'published' },
  { key: 'archived', label: 'Archived', status: 'archived' },
  { key: 'events', label: 'Events', contentType: 'event' }
]

export default async function InsightsListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageInsights(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const activeTab = TABS.find((t) => t.key === (sp.tab || 'all')) ?? TABS[0]

  const filter = {
    search: sp.search,
    status: (activeTab.status || (sp.status as InsightStatus) || '') as InsightStatus | '',
    category: sp.category || '',
    contentType: (activeTab.contentType || (sp.contentType as any) || '') as any,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    page,
    pageSize: 20
  }

  const { insights, total, pageSize } = await getInsights(filter)

  const buildTabHref = (tabKey: string) => {
    const params = new URLSearchParams()
    if (sp.search) params.set('search', sp.search)
    if (sp.category) params.set('category', sp.category)
    if (tabKey !== 'all') params.set('tab', tabKey)
    const qs = params.toString()
    return `/admin/insights${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content management</p>
          <h1 className="h-section mt-1">Insights &amp; Events</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            News, announcements, events and other content shown on the public website.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/insights/new" className="btn btn-primary btn-sm">
            <Plus size={15} className="mr-1.5" aria-hidden="true" /> Create Insight
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={buildTabHref(tab.key)}
            className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: activeTab.key === tab.key ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
              color: activeTab.key === tab.key ? '#fff' : 'var(--color-navy-900)'
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="card p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <input type="hidden" name="tab" value={activeTab.key} />
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" name="search" defaultValue={sp.search} placeholder="Title, slug, description" className="admin-input w-full" />
        </div>
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={sp.category || ''} className="admin-select w-full">
            <option value="">All categories</option>
            {INSIGHT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {activeTab.key === 'all' && (
          <div>
            <label htmlFor="contentType" className="field-label">Content type</label>
            <select id="contentType" name="contentType" defaultValue={sp.contentType || ''} className="admin-select w-full">
              <option value="">All types</option>
              {INSIGHT_CONTENT_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>{INSIGHT_CONTENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          <Link href={buildTabHref(activeTab.key)} className="btn btn-ghost btn-sm">Reset</Link>
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Author</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Publish date</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {insights.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
                  No insights match these filters yet.
                </td>
              </tr>
            ) : (
              insights.map((insight) => (
                <tr key={insight.id}>
                  <td className="font-medium max-w-[220px] truncate" style={{ color: 'var(--color-ink)' }}>
                    {insight.title}
                    {insight.content_type === 'event' && insight.event_start_at && (
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {new Date(insight.event_start_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </td>
                  <td>{insight.category}</td>
                  <td>{INSIGHT_CONTENT_TYPE_LABELS[insight.content_type]}</td>
                  <td>{insight.authorName || '—'}</td>
                  <td><StatusBadge status={insight.status} label={INSIGHT_STATUS_LABELS[insight.status]} /></td>
                  <td>{insight.is_featured ? '★' : '—'}</td>
                  <td>{insight.publish_at ? new Date(insight.publish_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td>{new Date(insight.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  <td><InsightRowActions insight={insight} canManage={canManage} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/insights" searchParams={sp} />
    </div>
  )
}
