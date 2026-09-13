import { redirect } from 'next/navigation'
import { requireStaff, canManageTestimonials } from '../../../../../lib/auth'
import TestimonialForm from '../../../../../components/admin/TestimonialForm'

export const metadata = { title: 'Add Testimonial | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewTestimonialPage() {
  const staff = await requireStaff()
  if (!canManageTestimonials(staff)) redirect('/admin/testimonials')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add testimonial</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Add a student story for the homepage and the public Testimonials page.
        </p>
      </div>
      <TestimonialForm mode="create" />
    </div>
  )
}
