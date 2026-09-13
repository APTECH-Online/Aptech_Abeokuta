import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageGallery } from '../../../../../lib/auth'
import { getGalleryItemById } from '../../../../../lib/crm/gallery'
import GalleryForm from '../../../../../components/admin/GalleryForm'

export const metadata = { title: 'Edit Photo | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditGalleryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageGallery(staff)) redirect('/admin/gallery')

  const { id } = await params
  const item = await getGalleryItemById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit photo</h1>
      </div>
      <GalleryForm mode="edit" item={item} />
    </div>
  )
}
