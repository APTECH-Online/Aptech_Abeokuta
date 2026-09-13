import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageFaqs } from '../../../../../lib/auth'
import { getFaqById } from '../../../../../lib/crm/faqs'
import FaqForm from '../../../../../components/admin/FaqForm'

export const metadata = { title: 'Edit FAQ | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageFaqs(staff)) redirect('/admin/faqs')

  const { id } = await params
  const item = await getFaqById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit FAQ</h1>
      </div>
      <FaqForm mode="edit" item={item} />
    </div>
  )
}
