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

type Relations = { courses: { slug: string; title: string }[]; insights: { slug: string; title: string }[] }

const CURRICULUM_EXAMPLE = `## Term 1: Foundations | 120 Hours
Optional one-line description of the term.
- Module name :: what the learner can do after it
- Another module

## Term 2: Next stage
- Module name`

export default function CourseForm({
  mode,
  course,
  controlsAvailable = false,
  relations = { courses: [], insights: [] }
}: {
  mode: 'create' | 'edit'
  course?: Course
  controlsAvailable?: boolean
  relations?: Relations
}) {
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

      <div className="grid md:grid-cols-3 gap-4">
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

      <fieldset className="admin-fieldset space-y-4">
        <legend className="field-label">Course details <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional. Each one appears on the public page only if you fill it in; leave blank if unsure)</span></legend>
        <input type="hidden" name="hadDetails" value={course?.audience || course?.prerequisites || course?.certification ? '1' : '0'} />
        <div>
          <label htmlFor="audience" className="field-label">Who is this course for?</label>
          <textarea id="audience" name="audience" rows={3} maxLength={800} defaultValue={course?.audience ?? ''} className="admin-input" />
        </div>
        <div>
          <label htmlFor="prerequisites" className="field-label">Entry requirements / prerequisites</label>
          <textarea id="prerequisites" name="prerequisites" rows={3} maxLength={800} defaultValue={course?.prerequisites ?? ''} className="admin-input" />
        </div>
        <div>
          <label htmlFor="certification" className="field-label">Certification awarded</label>
          <textarea id="certification" name="certification" rows={3} maxLength={800} defaultValue={course?.certification ?? ''} className="admin-input" />
        </div>
      </fieldset>

      <fieldset className="admin-fieldset space-y-4">
        <legend className="field-label">Page controls</legend>
        {!controlsAvailable ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            These controls (admission status, page heading, related links, curriculum, homepage) switch on after database migration
            <code> 0023_course_crm_controls.sql </code> is applied. Until then the public site keeps its previous behaviour.
          </p>
        ) : (
          <>
            <input type="hidden" name="controlsAvailable" value="1" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admissionStatus" className="field-label">Admission status</label>
                <select id="admissionStatus" name="admissionStatus" defaultValue={course?.admission_status ?? 'open'} className="admin-input">
                  <option value="open">Applications open</option>
                  <option value="coming_soon">Opening soon</option>
                  <option value="closed">Applications closed</option>
                </select>
                <p className="field-hint">Open shows &ldquo;Enroll now&rdquo;; opening soon shows &ldquo;Register your interest&rdquo;; closed shows &ldquo;Ask about the next intake&rdquo;.</p>
                {fieldErrors?.admissionStatus && <p className="field-error">{fieldErrors.admissionStatus}</p>}
              </div>
              <div>
                <label htmlFor="intakeNote" className="field-label">Intake note <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional, shown under the status)</span></label>
                <input id="intakeNote" name="intakeNote" type="text" maxLength={200} defaultValue={course?.intake_note ?? ''} className="admin-input" placeholder="Only enter dates you have confirmed" />
                {fieldErrors?.intakeNote && <p className="field-error">{fieldErrors.intakeNote}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="pageHeading" className="field-label">Page heading (H1) <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional, defaults to the title)</span></label>
              <input id="pageHeading" name="pageHeading" type="text" maxLength={120} defaultValue={course?.page_heading ?? ''} className="admin-input" placeholder="e.g. Linux Course in Abeokuta" />
              {fieldErrors?.pageHeading && <p className="field-error">{fieldErrors.pageHeading}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featuredHome" defaultChecked={course?.featured_home ?? false} />
              Show on the homepage &ldquo;career paths&rdquo; row (the first three flagged courses are shown)
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="field-label">Related courses <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(leave empty for automatic)</span></p>
                <div className="admin-input" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {relations.courses.length === 0 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No other published courses yet.</p>}
                  {/* Keep links to courses that are currently unpublished, so saving never silently drops them. */}
                  {(course?.related_courses ?? []).filter((s) => !relations.courses.some((c) => c.slug === s)).map((s) => (
                    <input key={`keep-${s}`} type="hidden" name="relatedCourses" value={s} />
                  ))}
                  {relations.courses.map((c) => (
                    <label key={c.slug} className="flex items-start gap-2 text-sm py-0.5">
                      <input type="checkbox" name="relatedCourses" value={c.slug} defaultChecked={course?.related_courses?.includes(c.slug)} className="mt-1" />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="field-label">Related guides <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(this course is also listed on those guides, up to 5 courses per guide)</span></p>
                <div className="admin-input" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {relations.insights.length === 0 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No published insights yet.</p>}
                  {(course?.related_insights ?? []).filter((s) => !relations.insights.some((i) => i.slug === s)).map((s) => (
                    <input key={`keep-${s}`} type="hidden" name="relatedInsights" value={s} />
                  ))}
                  {relations.insights.map((i) => (
                    <label key={i.slug} className="flex items-start gap-2 text-sm py-0.5">
                      <input type="checkbox" name="relatedInsights" value={i.slug} defaultChecked={course?.related_insights?.includes(i.slug)} className="mt-1" />
                      {i.title}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="curriculum" className="field-label">Curriculum <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional modules/terms)</span></label>
              <textarea id="curriculum" name="curriculum" rows={10} defaultValue={course?.curriculum ?? ''} className="admin-input admin-mono" placeholder={CURRICULUM_EXAMPLE} spellCheck={false} />
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Use <code>## Heading | hours</code> for each term or block and <code>- Module :: detail</code> for each module. The three flagship programmes (ADSE, Smart Pro, ACNS) keep their built-in detailed curricula, so leave this empty for them.
              </p>
              {fieldErrors?.curriculum && <p className="field-error">{fieldErrors.curriculum}</p>}
            </div>
          </>
        )}
      </fieldset>

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

      <section className="card p-5 sm:p-6 grid gap-4">
        <p className="eyebrow">SEO</p>
        <div>
          <label htmlFor="seoTitle" className="field-label">SEO title (optional)</label>
          <input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={course?.seo_title ?? ''} className="admin-input" />
          <p className="field-hint">If left blank, one is generated from the course name when you save. Max 70 characters.</p>
          {fieldErrors?.seoTitle && <p className="field-error">{fieldErrors.seoTitle}</p>}
        </div>
        <div>
          <label htmlFor="seoDescription" className="field-label">Meta description (optional)</label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            maxLength={160}
            defaultValue={course?.seo_description ?? ''}
            className="admin-input"
          />
          <p className="field-hint">If left blank, one is generated from the summary above when you save. Max 160 characters.</p>
          {fieldErrors?.seoDescription && <p className="field-error">{fieldErrors.seoDescription}</p>}
        </div>
        <label className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-body)' }}>
          <input type="checkbox" name="seoNoindex" defaultChecked={course?.seo_noindex ?? false} className="mt-1" />
          Hide this course from search engines (noindex)
        </label>
      </section>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Create course' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
