import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageTestimonials } from '../../../../../lib/auth'
import { getTestimonialById } from '../../../../../lib/crm/testimonials'
import TestimonialForm from '../../../../../components/admin/TestimonialForm'

export const metadata = { title: 'Edit Testimonial | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageTestimonials(staff)) redirect('/admin/testimonials')

  const { id } = await params
  const item = await getTestimonialById(id)
  if (!item) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit testimonial</h1>
      </div>
      <TestimonialForm mode="edit" item={item} />
    </div>
  )
}
