import Link from 'next/link'
import { Plus, Share2 } from 'lucide-react'
import { requireStaff, canManageSocialLinks } from '../../../../../lib/auth'
import { getSocialLinks, SOCIAL_PLATFORMS } from '../../../../../lib/crm/social-links'
import SocialLinkRowActions from '../../../../../components/admin/SocialLinkRowActions'
import Pagination from '../../../../../components/admin/Pagination'

export const metadata = { title: 'Social media | Admissions CRM' }
export const dynamic = 'force-dynamic'

const PLATFORM_LABELS = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.value, p.label]))

export default async function SocialLinksListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageSocialLinks(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    status: ((sp.status === 'published' || sp.status === 'unpublished' ? sp.status : '') as 'published' | 'unpublished' | ''),
    page,
    pageSize: 25
  }

  const { items, total, pageSize } = await getSocialLinks(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="h-section mt-1">Social media</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            These links and their icons appear in the footer on every public page. Adding or editing one here
            goes live without a code change.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/settings/social/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add link
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to social media links. Ask a Super Admin for Content Manager access to add or edit.
        </p>
      )}

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/settings/social" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <Share2 size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No social links yet</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Add Facebook, Instagram, or any other channel to have it show up in the footer.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Link</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {PLATFORM_LABELS[item.platform] ?? item.platform}
                    </p>
                    {item.label && (
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
                    )}
                  </td>
                  <td>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline line-clamp-1 break-all"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {item.url}
                    </a>
                  </td>
                  <td>
                    {item.is_published ? (
                      <span className="status-pill" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Published</span>
                    ) : (
                      <span className="status-pill" style={{ background: '#F2F0F5', color: 'var(--color-muted)' }}>Unpublished</span>
                    )}
                  </td>
                  <td>{item.sort_order}</td>
                  <td><SocialLinkRowActions item={item} canManage={canManage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/settings/social" searchParams={sp} />
    </div>
  )
}
