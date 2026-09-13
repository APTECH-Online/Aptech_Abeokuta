import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { requireStaff, canManageCourses } from '../../../../lib/auth'
import { getCourses } from '../../../../lib/crm/courses'
import { COURSE_CATEGORY_LABELS, COURSE_CATEGORY_ORDER, COURSE_STATUS_LABELS } from '../../../../types/db'
import type { CourseCategory, CourseStatus } from '../../../../types/db'
import StatusBadge from '../../../../components/admin/StatusBadge'
import Pagination from '../../../../components/admin/Pagination'
import CourseRowActions from '../../../../components/admin/CourseRowActions'

export const metadata = { title: 'Courses | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function CoursesListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const staff = await requireStaff()
  const canManage = canManageCourses(staff)
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const filter = {
    search: sp.search || '',
    category: (COURSE_CATEGORY_ORDER.includes(sp.category as CourseCategory) ? sp.category : '') as CourseCategory | '',
    status: (['draft', 'published', 'archived'].includes(sp.status || '') ? sp.status : '') as CourseStatus | '',
    page,
    pageSize: 25
  }

  const { courses, total, pageSize } = await getCourses(filter)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="h-section mt-1">Courses</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            The full course catalogue shown on the public /courses page — Advanced Diploma, Smart Pro, ACNS and every Short Term Course.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/courses/new" className="btn btn-primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Add course
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You have read-only access to Courses. Ask a Super Admin for Content Manager access to add or edit courses.
        </p>
      )}

      <form className="card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="search" className="field-label">Search</label>
          <input id="search" name="search" type="text" defaultValue={sp.search || ''} className="admin-input" placeholder="Title, summary or slug" />
        </div>
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={sp.category || ''} className="admin-select">
            <option value="">All</option>
            {COURSE_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{COURSE_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="admin-select">
            <option value="">All</option>
            {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((s) => (
              <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/courses" className="btn btn-ghost btn-sm">Reset</Link>
      </form>

      {courses.length === 0 ? (
        <div className="card p-10 text-center grid gap-3 justify-items-center">
          <BookOpen size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No courses found</p>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
            Try adjusting your filters, or add the first course to this category.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{course.title}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>/{course.slug}</p>
                  </td>
                  <td>{COURSE_CATEGORY_LABELS[course.category]}</td>
                  <td>{course.duration}</td>
                  <td><StatusBadge status={course.status} label={COURSE_STATUS_LABELS[course.status]} /></td>
                  <td><CourseRowActions course={course} canManage={canManage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/courses" searchParams={sp} />
    </div>
  )
}
