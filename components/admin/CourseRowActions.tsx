'use client'

import { useActionState } from 'react'
import { useAdminFeedback } from './AdminFeedbackProvider'
import { useActionFeedback } from './AdminFeedbackProvider'
import Link from 'next/link'
import {
  publishCourse,
  archiveCourse,
  restoreCourseToDraft,
  deleteCourse,
  type ActionResult
} from '../../app/admin/(dashboard)/courses/actions'
import type { Course } from '../../types/db'

const initial: ActionResult = { ok: true }

function QuickActionForm({
  action,
  courseId,
  label
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  courseId: string
  label: string
}) {
  const [actionState, formAction, pending] = useActionState(action, initial)
  useActionFeedback(actionState, 'Action completed successfully.')
  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>
        {pending ? 'Working…' : label}
      </button>
    </form>
  )
}

function DeleteForm({ course }: { course: Course }) {
  const { confirm } = useAdminFeedback()
  const [state, formAction] = useActionState(deleteCourse, initial)
  useActionFeedback(state, 'Delete course completed successfully.')
  return (
    <form
      action={formAction}
      onSubmit={async (e) => {
        e.preventDefault()
        const accepted = await confirm({ title: 'Delete course?', message: `Permanently delete \"${course.title}\"? This cannot be undone.`, confirmLabel: 'Delete', danger: true })
        if (accepted) e.currentTarget.requestSubmit()
      }}
    >
      <input type="hidden" name="courseId" value={course.id} />
      <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
        Delete
      </button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

export default function CourseRowActions({ course, canManage }: { course: Course; canManage: boolean }) {
  if (!canManage) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/admin/courses/${course.id}`} className="btn btn-ghost btn-sm">Edit</Link>

      {course.status !== 'published' && (
        <QuickActionForm action={publishCourse} courseId={course.id} label="Publish" />
      )}
      {course.status === 'published' && (
        <QuickActionForm action={archiveCourse} courseId={course.id} label="Archive" />
      )}
      {course.status === 'archived' && (
        <QuickActionForm action={restoreCourseToDraft} courseId={course.id} label="Restore to draft" />
      )}
      {(course.status === 'draft' || course.status === 'archived') && <DeleteForm course={course} />}
    </div>
  )
}
