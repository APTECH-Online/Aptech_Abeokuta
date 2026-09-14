import { redirect } from 'next/navigation'
import { requireStaff, canManagePartners } from '../../../../../../../lib/auth'
import PartnerOrganizationForm from '../../../../../../../components/admin/PartnerOrganizationForm'

export const metadata = { title: 'Add partner | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewPartnerOrganizationPage() {
  const staff = await requireStaff()
  if (!canManagePartners(staff)) redirect('/admin/settings/partners/organizations')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add industry partner</h1>
      </div>
      <PartnerOrganizationForm mode="create" />
    </div>
  )
}
