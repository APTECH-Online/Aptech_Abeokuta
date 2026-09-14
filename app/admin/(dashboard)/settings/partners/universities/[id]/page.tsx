import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManagePartners } from '../../../../../../../lib/auth'
import { getAffiliatedUniversityById } from '../../../../../../../lib/crm/partners'
import AffiliatedUniversityForm from '../../../../../../../components/admin/AffiliatedUniversityForm'

export const metadata = { title: 'Edit affiliated university | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditAffiliatedUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManagePartners(staff)) redirect('/admin/settings/partners/universities')

  const { id } = await params
  const item = await getAffiliatedUniversityById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit affiliated university</h1>
      </div>
      <AffiliatedUniversityForm mode="edit" item={item} />
    </div>
  )
}
