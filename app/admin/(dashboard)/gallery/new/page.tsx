import { redirect } from 'next/navigation'
import { requireStaff, canManageGallery } from '../../../../../lib/auth'
import GalleryForm from '../../../../../components/admin/GalleryForm'

export const metadata = { title: 'Add Photo | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewGalleryItemPage() {
  const staff = await requireStaff()
  if (!canManageGallery(staff)) redirect('/admin/gallery')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add photo</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Upload a photo for the public Gallery page.
        </p>
      </div>
      <GalleryForm mode="create" />
    </div>
  )
}
