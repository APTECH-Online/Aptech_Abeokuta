'use client'

import { useActionState, useEffect, useState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FormAlert from '../shared/FormAlert'
import { createCourse, updateCourse, type ActionResult } from '../../app/admin/(dashboard)/courses/actions'
import { COURSE_CATEGORY_LABELS, COURSE_CATEGORY_ORDER, COURSE_STATUS_LABELS } from '../../types/db'
import type { Course, CourseCategory, CourseStatus } from '../../types/db'
import { slugify } from '../../lib/validation'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function CourseForm({ mode, course }: { mode: 'create' | 'edit'; course?: Course }) {
  const action = mode === 'create' ? createCourse : updateCourse
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  const router = useRouter()

  useEffect(() => {
    if (mode === 'create' && state.ok && 'id' in state && state.id) {
      router.push(`/admin/courses/${state.id}?created=1`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const [title, setTitle] = useState(course?.title ?? '')
  const [slug, setSlug] = useState(course?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [imagePreview, setImagePreview] = useState<string | null>(course?.cover_image ?? null)
  const [removeImage, setRemoveImage] = useState(false)

  return (
    <form action={formAction} className="grid gap-6 max-w-3xl">
      {mode === 'edit' && course && <input type="hidden" name="courseId" value={course.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="field-label">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            className="admin-input"
            placeholder="e.g. Responsive Web Development"
          />
          {fieldErrors?.title && <p className="field-error">{fieldErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="field-label">URL slug</label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            className="admin-input"
            placeholder="auto-generated-from-title"
          />
          {fieldErrors?.slug && <p className="field-error">{fieldErrors.slug}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={course?.category ?? 'short_term'} className="admin-select">
            {COURSE_CATEGORY_ORDER.map((c: CourseCategory) => (
              <option key={c} value={c}>{COURSE_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          {fieldErrors?.category && <p className="field-error">{fieldErrors.category}</p>}
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={course?.status ?? 'draft'} className="admin-select">
            {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((s) => (
              <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>
            ))}
          </select>
          {fieldErrors?.status && <p className="field-error">{fieldErrors.status}</p>}
        </div>
        <div>
          <label htmlFor="displayOrder" className="field-label">Sort order</label>
          <input id="displayOrder" name="displayOrder" type="number" defaultValue={course?.display_order ?? 0} className="admin-input" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="duration" className="field-label">Duration</label>
          <input id="duration" name="duration" type="text" required defaultValue={course?.duration ?? ''} className="admin-input" placeholder="e.g. 3 Months" />
          {fieldErrors?.duration && <p className="field-error">{fieldErrors.duration}</p>}
        </div>
        <div>
          <label htmlFor="level" className="field-label">Level</label>
          <input id="level" name="level" type="text" required defaultValue={course?.level ?? ''} className="admin-input" placeholder="e.g. Beginner to Intermediate" />
          {fieldErrors?.level && <p className="field-error">{fieldErrors.level}</p>}
        </div>
        <div>
          <label htmlFor="mode" className="field-label">Mode</label>
          <input id="mode" name="mode" type="text" required defaultValue={course?.mode ?? ''} className="admin-input" placeholder="e.g. Short-term, instructor-led course" />
          {fieldErrors?.mode && <p className="field-error">{fieldErrors.mode}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="field-label">Summary</label>
        <textarea id="summary" name="summary" required rows={2} defaultValue={course?.summary ?? ''} className="admin-input" placeholder="One or two sentences shown on the course card and search results" />
        {fieldErrors?.summary && <p className="field-error">{fieldErrors.summary}</p>}
      </div>

      <div>
        <label htmlFor="description" className="field-label">Full description</label>
        <textarea id="description" name="description" required rows={5} defaultValue={course?.description ?? ''} className="admin-input" placeholder="The full description shown on the course detail page" />
        {fieldErrors?.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="highlights" className="field-label">Highlights <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(one per line)</span></label>
          <textarea id="highlights" name="highlights" rows={6} defaultValue={course?.highlights.join('\n') ?? ''} className="admin-input" />
        </div>
        <div>
          <label htmlFor="tools" className="field-label">Tools <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(one per line)</span></label>
          <textarea id="tools" name="tools" rows={6} defaultValue={course?.tools.join('\n') ?? ''} className="admin-input" />
        </div>
        <div>
          <label htmlFor="outcomes" className="field-label">Outcomes <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(one per line)</span></label>
          <textarea id="outcomes" name="outcomes" rows={6} defaultValue={course?.outcomes.join('\n') ?? ''} className="admin-input" />
        </div>
      </div>

      <div>
        <label htmlFor="coverImage" className="field-label">
          Cover image {mode === 'edit' && <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional — leave blank to keep the current one)</span>}
        </label>
        <input
          id="coverImage"
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setImagePreview(URL.createObjectURL(file))
              setRemoveImage(false)
            }
          }}
          className="admin-input"
        />
        {fieldErrors?.coverImage && <p className="field-error">{fieldErrors.coverImage}</p>}
        {imagePreview && !removeImage && (
          <div className="mt-3 relative w-full max-w-xs aspect-video rounded-md overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={imagePreview.startsWith('blob:')} />
          </div>
        )}
        {mode === 'edit' && course?.cover_image && (
          <label className="flex items-center gap-2 text-sm mt-2" style={{ color: 'var(--color-ink)' }}>
            <input
              type="checkbox"
              name="removeImage"
              checked={removeImage}
              onChange={(e) => {
                setRemoveImage(e.target.checked)
                if (e.target.checked) setImagePreview(null)
                else setImagePreview(course?.cover_image ?? null)
              }}
            />
            Remove current cover image
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Create course' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
