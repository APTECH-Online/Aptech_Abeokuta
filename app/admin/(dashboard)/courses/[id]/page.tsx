import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageCourses } from '../../../../../lib/auth'
import { getCourseById } from '../../../../../lib/crm/courses'
import CourseForm from '../../../../../components/admin/CourseForm'

export const metadata = { title: 'Edit Course | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageCourses(staff)) redirect('/admin/courses')

  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit course</h1>
      </div>
      <CourseForm mode="edit" course={course} />
    </div>
  )
}
