import Link from 'next/link'
import Image from 'next/image'
import { Plus, GraduationCap } from 'lucide-react'
import { requireStaff, canManagePartners } from '../../../../../../lib/auth'
import { getAffiliatedUniversities } from '../../../../../../lib/crm/partners'
import AffiliatedUniversityRowActions from '../../../../../../components/admin/AffiliatedUniversityRowActions'
import Pagination from '../../../../../../components/admin/Pagination'

export const metadata = { title: 'Affiliated universities | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function AffiliatedUniversitiesListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManagePartners(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    status: ((sp.status === 'published' || sp.status === 'unpublished' ? sp.status : '') as 'published' | 'unpublished' | ''),
    page,
    pageSize: 25
  }

  const { items, total, pageSize } = await getAffiliatedUniversities(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            <Link href="/admin/settings/partners" className="hover:underline">Partners & alliances</Link>
          </p>
          <h1 className="h-section mt-1">Affiliated universities</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            This logo grid appears on the Home and About pages.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/settings/partners/universities/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add university
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to this section. Ask a Super Admin for Content Manager access to add or edit.
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
        <Link href="/admin/settings/partners/universities" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <GraduationCap size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No affiliated universities yet</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Add a university logo to have it show up on the Home and About pages.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Website</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center justify-center w-16 h-10 rounded border p-1.5" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                      <div className="relative w-full h-full">
                        <Image src={item.logo_url} alt={`${item.name} logo`} fill className="object-contain" sizes="64px" />
                      </div>
                    </div>
                  </td>
                  <td><p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{item.name}</p></td>
                  <td>
                    {item.website_url ? (
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline line-clamp-1 break-all"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {item.website_url}
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {item.is_published ? (
                      <span className="status-pill" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Published</span>
                    ) : (
                      <span className="status-pill" style={{ background: '#F2F0F5', color: 'var(--color-muted)' }}>Unpublished</span>
                    )}
                  </td>
                  <td>{item.sort_order}</td>
                  <td><AffiliatedUniversityRowActions item={item} canManage={canManage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/settings/partners/universities" searchParams={sp} />
    </div>
  )
}
