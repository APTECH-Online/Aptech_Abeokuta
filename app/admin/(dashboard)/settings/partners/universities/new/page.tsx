import { redirect } from 'next/navigation'
import { requireStaff, canManagePartners } from '../../../../../../../lib/auth'
import AffiliatedUniversityForm from '../../../../../../../components/admin/AffiliatedUniversityForm'

export const metadata = { title: 'Add affiliated university | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewAffiliatedUniversityPage() {
  const staff = await requireStaff()
  if (!canManagePartners(staff)) redirect('/admin/settings/partners/universities')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add affiliated university</h1>
      </div>
      <AffiliatedUniversityForm mode="create" />
    </div>
  )
}
