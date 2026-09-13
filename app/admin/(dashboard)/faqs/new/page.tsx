import { redirect } from 'next/navigation'
import { requireStaff, canManageFaqs } from '../../../../../lib/auth'
import FaqForm from '../../../../../components/admin/FaqForm'

export const metadata = { title: 'Add FAQ | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewFaqPage() {
  const staff = await requireStaff()
  if (!canManageFaqs(staff)) redirect('/admin/faqs')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add FAQ</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Add a question and answer for the public FAQ sections.
        </p>
      </div>
      <FaqForm mode="create" />
    </div>
  )
}
