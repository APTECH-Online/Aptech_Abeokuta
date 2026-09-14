import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManagePartners } from '../../../../../../../lib/auth'
import { getPartnerOrganizationById } from '../../../../../../../lib/crm/partners'
import PartnerOrganizationForm from '../../../../../../../components/admin/PartnerOrganizationForm'

export const metadata = { title: 'Edit partner | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditPartnerOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManagePartners(staff)) redirect('/admin/settings/partners/organizations')

  const { id } = await params
  const item = await getPartnerOrganizationById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit industry partner</h1>
      </div>
      <PartnerOrganizationForm mode="edit" item={item} />
    </div>
  )
}
