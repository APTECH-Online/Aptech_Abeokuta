import { redirect } from 'next/navigation'
import { requireStaff, canManageCourses } from '../../../../../lib/auth'
import CourseForm from '../../../../../components/admin/CourseForm'

export const metadata = { title: 'Add Course | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewCoursePage() {
  const staff = await requireStaff()
  if (!canManageCourses(staff)) redirect('/admin/courses')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Add course</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Add a new course, programme or short course to the public catalogue.
        </p>
      </div>
      <CourseForm mode="create" />
    </div>
  )
}
