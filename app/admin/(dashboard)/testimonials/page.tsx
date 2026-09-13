import Link from 'next/link'
import Image from 'next/image'
import { Plus, MessageSquareQuote } from 'lucide-react'
import { requireStaff, canManageTestimonials } from '../../../../lib/auth'
import { getTestimonials } from '../../../../lib/crm/testimonials'
import Pagination from '../../../../components/admin/Pagination'
import TestimonialRowActions from '../../../../components/admin/TestimonialRowActions'

export const metadata = { title: 'Testimonials | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function TestimonialsListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageTestimonials(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    search: sp.search || '',
    status: ((sp.status === 'published' || sp.status === 'unpublished' ? sp.status : '') as 'published' | 'unpublished' | ''),
    page,
    pageSize: 24
  }

  const { items, total, pageSize } = await getTestimonials(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="h-section mt-1">Testimonials</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Student stories shown on the homepage and the public /testimonials page.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/testimonials/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add testimonial
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to Testimonials. Ask a Super Admin for Content Manager access to add or edit.
        </p>
      )}

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" name="search" type="text" defaultValue={sp.search || ''} className="admin-input" placeholder="Name, programme or quote" />
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
        <Link href="/admin/testimonials" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <MessageSquareQuote size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No testimonials found</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Try adjusting your filters, or add the first testimonial.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="relative shrink-0 rounded-full overflow-hidden" style={{ width: 44, height: 44, background: 'var(--color-navy-100)' }}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-ink)' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.program}</p>
                </div>
                {!item.is_published && (
                  <span
                    className="ml-auto shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                    style={{ background: 'var(--color-ink)', color: 'white', opacity: 0.85 }}
                  >
                    Unpublished
                  </span>
                )}
              </div>
              <p className="text-sm line-clamp-4" style={{ color: 'var(--color-body)' }}>&ldquo;{item.quote}&rdquo;</p>
              <TestimonialRowActions item={item} canManage={canManage} />
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/testimonials" searchParams={sp} />
    </div>
  )
}
