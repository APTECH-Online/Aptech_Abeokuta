'use client'

import { useActionState, useEffect, useState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import FormAlert from '../shared/FormAlert'
import RichTextEditor from './RichTextEditor'
import { createInsight, updateInsight, type ActionResult } from '../../app/admin/(dashboard)/insights/actions'
import { INSIGHT_CATEGORIES, INSIGHT_CONTENT_TYPE_LABELS, INSIGHT_CONTENT_TYPE_ORDER } from '../../types/db'
import type { InsightRow } from '../../lib/crm/insights'
import { slugify } from '../../lib/validation'

const initial: ActionResult = { ok: true }

/** Converts a stored ISO timestamp to the value a <input type="datetime-local"> expects. */
function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function SubmitButton({
  intent,
  children,
  variant = 'primary'
}: {
  intent: 'draft' | 'schedule' | 'publish'
  children: string
  variant?: 'primary' | 'secondary'
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} disabled:opacity-60`}
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function InsightForm({ mode, insight }: { mode: 'create' | 'edit'; insight?: InsightRow }) {
  const action = mode === 'create' ? createInsight : updateInsight
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  const router = useRouter()

  useEffect(() => {
    if (mode === 'create' && state.ok && 'id' in state && state.id) {
      router.push(`/admin/insights/${state.id}?created=1`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const [title, setTitle] = useState(insight?.title ?? '')
  const [slug, setSlug] = useState(insight?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [contentType, setContentType] = useState(insight?.content_type ?? 'news')
  const [imagePreview, setImagePreview] = useState<string | null>(insight?.featured_image ?? null)
  const [removeImage, setRemoveImage] = useState(false)

  const isEvent = contentType === 'event'

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <form action={formAction} className="grid gap-6" encType="multipart/form-data">
      {mode === 'edit' && insight && <input type="hidden" name="insightId" value={insight.id} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6">
          <section className="card p-5 sm:p-6 grid gap-4">
            <div>
              <label htmlFor="title" className="field-label">Title</label>
              <input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`field-input ${fieldErrors?.title ? 'field-error' : ''}`}
                placeholder="e.g. APTECH Abeokuta Hosts Technology Workshop"
              />
              {fieldErrors?.title && <p className="field-error-text">{fieldErrors.title}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="field-label">Slug</label>
              <input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                className={`field-input font-mono text-sm ${fieldErrors?.slug ? 'field-error' : ''}`}
              />
              <p className="field-hint">
                Public URL: /insights/{slug || 'your-slug-here'}
                {mode === 'edit' && insight && slug !== insight.slug && ' — changing this will change the live URL.'}
              </p>
              {fieldErrors?.slug && <p className="field-error-text">{fieldErrors.slug}</p>}
            </div>

            <div>
              <label htmlFor="shortDescription" className="field-label">Short description</label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                defaultValue={insight?.short_description ?? ''}
                className="field-textarea"
                placeholder="One or two sentences shown in listings and search results."
              />
              {fieldErrors?.shortDescription && <p className="field-error-text">{fieldErrors.shortDescription}</p>}
            </div>

            <div>
              <label className="field-label">Content</label>
              <RichTextEditor name="content" defaultValue={insight?.content} error={fieldErrors?.content} />
            </div>
          </section>

          {isEvent && (
            <section className="card p-5 sm:p-6 grid gap-4">
              <p className="eyebrow">Event details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventStartAt" className="field-label">Event start</label>
                  <input
                    id="eventStartAt"
                    name="eventStartAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(insight?.event_start_at)}
                    className={`field-input ${fieldErrors?.eventStartAt ? 'field-error' : ''}`}
                  />
                  {fieldErrors?.eventStartAt && <p className="field-error-text">{fieldErrors.eventStartAt}</p>}
                </div>
                <div>
                  <label htmlFor="eventEndAt" className="field-label">Event end (optional)</label>
                  <input
                    id="eventEndAt"
                    name="eventEndAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(insight?.event_end_at)}
                    className={`field-input ${fieldErrors?.eventEndAt ? 'field-error' : ''}`}
                  />
                  {fieldErrors?.eventEndAt && <p className="field-error-text">{fieldErrors.eventEndAt}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="eventVenue" className="field-label">Venue / location</label>
                <input
                  id="eventVenue"
                  name="eventVenue"
                  defaultValue={insight?.event_venue ?? ''}
                  className={`field-input ${fieldErrors?.eventVenue ? 'field-error' : ''}`}
                  placeholder="e.g. APTECH Abeokuta Campus, Main Auditorium"
                />
                {fieldErrors?.eventVenue && <p className="field-error-text">{fieldErrors.eventVenue}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventRegistrationUrl" className="field-label">Registration URL (optional)</label>
                  <input
                    id="eventRegistrationUrl"
                    name="eventRegistrationUrl"
                    type="url"
                    defaultValue={insight?.event_registration_url ?? ''}
                    className={`field-input ${fieldErrors?.eventRegistrationUrl ? 'field-error' : ''}`}
                    placeholder="https://…"
                  />
                  {fieldErrors?.eventRegistrationUrl && <p className="field-error-text">{fieldErrors.eventRegistrationUrl}</p>}
                </div>
                <div>
                  <label htmlFor="eventContact" className="field-label">Contact info (optional)</label>
                  <input
                    id="eventContact"
                    name="eventContact"
                    defaultValue={insight?.event_contact ?? ''}
                    className="field-input"
                    placeholder="Phone, email, or WhatsApp"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="card p-5 sm:p-6 grid gap-4">
            <p className="eyebrow">SEO</p>
            <div>
              <label htmlFor="seoTitle" className="field-label">SEO title (optional)</label>
              <input id="seoTitle" name="seoTitle" defaultValue={insight?.seo_title ?? ''} className="field-input" />
              <p className="field-hint">Falls back to the title above if left blank.</p>
              {fieldErrors?.seoTitle && <p className="field-error-text">{fieldErrors.seoTitle}</p>}
            </div>
            <div>
              <label htmlFor="seoDescription" className="field-label">Meta description (optional)</label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                rows={2}
                defaultValue={insight?.seo_description ?? ''}
                className="field-textarea"
              />
              <p className="field-hint">Falls back to the short description above if left blank.</p>
              {fieldErrors?.seoDescription && <p className="field-error-text">{fieldErrors.seoDescription}</p>}
            </div>
          </section>
        </div>

        <div className="grid gap-6 content-start">
          <section className="card p-5 sm:p-6 grid gap-4">
            <p className="eyebrow">Classification</p>
            <div>
              <label htmlFor="contentType" className="field-label">Content type</label>
              <select
                id="contentType"
                name="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as typeof contentType)}
                className="field-select"
              >
                {INSIGHT_CONTENT_TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>{INSIGHT_CONTENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="category" className="field-label">Category</label>
              <select
                id="category"
                name="category"
                defaultValue={insight?.category ?? INSIGHT_CATEGORIES[0]}
                className="field-select"
              >
                {INSIGHT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {fieldErrors?.category && <p className="field-error-text">{fieldErrors.category}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
              <input type="checkbox" name="isFeatured" defaultChecked={insight?.is_featured ?? false} className="accent-[var(--color-navy-700)]" />
              Feature on the public homepage
            </label>
          </section>

          <section className="card p-5 sm:p-6 grid gap-4">
            <p className="eyebrow">Featured image</p>
            {imagePreview && !removeImage && (
              <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-line)', aspectRatio: '16 / 9' }}>
                <Image src={imagePreview} alt="Featured image preview" fill className="object-cover" unoptimized />
              </div>
            )}
            <input type="file" name="featuredImage" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} className="admin-input w-full" />
            {fieldErrors?.featuredImage && <p className="field-error-text">{fieldErrors.featuredImage}</p>}
            {mode === 'edit' && insight?.featured_image && (
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(e) => {
                    setRemoveImage(e.target.checked)
                    if (e.target.checked) setImagePreview(null)
                    else setImagePreview(insight.featured_image)
                  }}
                />
                Remove current image
              </label>
            )}
            <p className="field-hint">JPG, PNG, WEBP or GIF, up to 5MB.</p>
          </section>

          <section className="card p-5 sm:p-6 grid gap-4">
            <p className="eyebrow">Publishing</p>
            <div>
              <label htmlFor="publishAt" className="field-label">Publish date &amp; time</label>
              <input
                id="publishAt"
                name="publishAt"
                type="datetime-local"
                defaultValue={toLocalInput(insight?.publish_at)}
                className={`field-input ${fieldErrors?.publishAt ? 'field-error' : ''}`}
              />
              <p className="field-hint">Leave blank to publish immediately when you click Publish.</p>
              {fieldErrors?.publishAt && <p className="field-error-text">{fieldErrors.publishAt}</p>}
            </div>
            <div>
              <label htmlFor="expiresAt" className="field-label">Expiry date &amp; time (optional)</label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                defaultValue={toLocalInput(insight?.expires_at)}
                className={`field-input ${fieldErrors?.expiresAt ? 'field-error' : ''}`}
              />
              <p className="field-hint">After this time the content is automatically hidden from the public site.</p>
              {fieldErrors?.expiresAt && <p className="field-error-text">{fieldErrors.expiresAt}</p>}
            </div>

            {!state.ok && (
              <FormAlert variant="error" title="Couldn't save this insight"><p>{state.message}</p></FormAlert>
            )}

            <div className="grid gap-2">
              <SubmitButton intent="publish">Publish now</SubmitButton>
              <SubmitButton intent="schedule" variant="secondary">Schedule</SubmitButton>
              <SubmitButton intent="draft" variant="secondary">Save as draft</SubmitButton>
              {mode === 'edit' && insight && (
                <Link href={`/admin/insights/${insight.id}/preview`} className="btn btn-ghost text-center">
                  Preview
                </Link>
              )}
              <Link href="/admin/insights" className="btn btn-ghost text-center">Cancel</Link>
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
