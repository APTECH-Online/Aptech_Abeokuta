import Link from 'next/link'
import { Plus, HelpCircle } from 'lucide-react'
import { requireStaff, canManageFaqs } from '../../../../lib/auth'
import { getFaqs } from '../../../../lib/crm/faqs'
import FaqRowActions from '../../../../components/admin/FaqRowActions'
import Pagination from '../../../../components/admin/Pagination'

export const metadata = { title: 'FAQs | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function FaqsListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageFaqs(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    search: sp.search || '',
    status: ((sp.status === 'published' || sp.status === 'unpublished' ? sp.status : '') as 'published' | 'unpublished' | ''),
    page,
    pageSize: 25
  }

  const { items, total, pageSize } = await getFaqs(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="h-section mt-1">FAQs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Shown in full on the homepage, and as the first 3 (by sort order) on the Admissions page.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/faqs/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add FAQ
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to FAQs. Ask a Super Admin for Content Manager access to add or edit.
        </p>
      )}

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" name="search" type="text" defaultValue={sp.search || ''} className="admin-input" placeholder="Question or answer" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/faqs" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <HelpCircle size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No FAQs found</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Try adjusting your filters, or add the first question.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{item.question}</p>
                    <p className="text-xs line-clamp-1" style={{ color: 'var(--color-muted)' }}>{item.answer}</p>
                  </td>
                  <td>
                    {item.is_published ? (
                      <span className="status-pill" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Published</span>
                    ) : (
                      <span className="status-pill" style={{ background: '#F2F0F5', color: 'var(--color-muted)' }}>Unpublished</span>
                    )}
                  </td>
                  <td>{item.sort_order}</td>
                  <td><FaqRowActions item={item} canManage={canManage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/faqs" searchParams={sp} />
    </div>
  )
}
