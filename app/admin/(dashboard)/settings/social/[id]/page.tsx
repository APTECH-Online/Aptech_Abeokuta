import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageSocialLinks } from '../../../../../../lib/auth'
import { getSocialLinkById } from '../../../../../../lib/crm/social-links'
import SocialLinkForm from '../../../../../../components/admin/SocialLinkForm'

export const metadata = { title: 'Edit social link | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageSocialLinks(staff)) redirect('/admin/settings/social')

  const { id } = await params
  const item = await getSocialLinkById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit social link</h1>
      </div>
      <SocialLinkForm mode="edit" item={item} />
    </div>
  )
}
