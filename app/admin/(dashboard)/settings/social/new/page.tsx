import { redirect } from 'next/navigation'
import { requireStaff, canManageSocialLinks } from '../../../../../../lib/auth'
import SocialLinkForm from '../../../../../../components/admin/SocialLinkForm'

export const metadata = { title: 'Add social link | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewSocialLinkPage() {
  const staff = await requireStaff()
  if (!canManageSocialLinks(staff)) redirect('/admin/settings/social')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add social link</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Add a channel to show as an icon in the site footer.
        </p>
      </div>
      <SocialLinkForm mode="create" />
    </div>
  )
}
