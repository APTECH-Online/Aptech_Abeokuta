import Link from 'next/link'
import Image from 'next/image'
import { Plus, ImageOff } from 'lucide-react'
import { requireStaff, canManageGallery } from '../../../../lib/auth'
import { getGalleryItems } from '../../../../lib/crm/gallery'
import { GALLERY_CATEGORIES } from '../../../../types/db'
import Pagination from '../../../../components/admin/Pagination'
import GalleryRowActions from '../../../../components/admin/GalleryRowActions'

export const metadata = { title: 'Gallery | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function GalleryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageGallery(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    search: sp.search || '',
    category: sp.category || '',
    status: ((sp.status === 'published' || sp.status === 'unpublished' ? sp.status : '') as 'published' | 'unpublished' | ''),
    page,
    pageSize: 24
  }

  const { items, total, pageSize } = await getGalleryItems(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="h-section mt-1">Gallery</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Photos shown on the public /gallery page. Add, edit, reorder or remove them here — no deploy needed.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/gallery/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add photo
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to the Gallery. Ask a Super Admin for Content Manager access to add or edit photos.
        </p>
      )}

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" name="search" type="text" defaultValue={sp.search || ''} className="admin-input" placeholder="Title or alt text" />
        </div>
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={sp.category || ''} className="admin-select">
            <option value="">All</option>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
        <Link href="/admin/gallery" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <ImageOff size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No photos found</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Try adjusting your filters, or add the first photo to this gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <div className="relative w-full aspect-[4/3]" style={{ background: 'var(--color-surface-muted, #f3f4f6)' }}>
                <Image src={item.image_url} alt={item.alt_text} fill className="object-cover" sizes="(max-width: 767px) 50vw, 25vw" />
                {!item.is_published && (
                  <span
                    className="absolute top-2 left-2 text-[0.65rem] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                    style={{ background: 'var(--color-ink)', color: 'white', opacity: 0.85 }}
                  >
                    Unpublished
                  </span>
                )}
              </div>
              <div className="p-3 grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>{item.category}</p>
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-ink)' }} title={item.title}>{item.title}</p>
                <GalleryRowActions item={item} canManage={canManage} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/gallery" searchParams={sp} />
    </div>
  )
}
