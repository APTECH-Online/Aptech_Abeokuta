'use client'

import { useActionState, useState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import FormAlert from '../shared/FormAlert'
import { createTestimonial, updateTestimonial, type ActionResult } from '../../app/admin/(dashboard)/testimonials/actions'
import type { Testimonial } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function TestimonialForm({ mode, item }: { mode: 'create' | 'edit'; item?: Testimonial }) {
  const action = mode === 'create' ? createTestimonial : updateTestimonial
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)
  const [removeImage, setRemoveImage] = useState(false)

  return (
    <form action={formAction} className="grid gap-6 max-w-2xl">
      {mode === 'edit' && item && <input type="hidden" name="itemId" value={item.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="field-label">Name</label>
          <input id="name" name="name" type="text" required maxLength={120} defaultValue={item?.name ?? ''} className="admin-input" placeholder="e.g. Lesley" />
          {fieldErrors?.name && <p className="field-error">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="program" className="field-label">Programme</label>
          <input id="program" name="program" type="text" required defaultValue={item?.program ?? ''} className="admin-input" placeholder="e.g. ADSE" />
          {fieldErrors?.program && <p className="field-error">{fieldErrors.program}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="quote" className="field-label">Quote</label>
        <textarea id="quote" name="quote" required rows={5} maxLength={2000} defaultValue={item?.quote ?? ''} className="admin-input" placeholder="What the student said, in their own words" />
        {fieldErrors?.quote && <p className="field-error">{fieldErrors.quote}</p>}
      </div>

      <div>
        <label htmlFor="image" className="field-label">
          Photo {mode === 'edit' && <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional — leave blank to keep the current one)</span>}
        </label>
        <input
          id="image"
          name="image"
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
        {fieldErrors?.image && <p className="field-error">{fieldErrors.image}</p>}
        {imagePreview && !removeImage && (
          <div className="mt-3 relative w-24 h-24 rounded-full overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={imagePreview.startsWith('blob:')} />
          </div>
        )}
        {mode === 'edit' && item?.image_url && (
          <label className="flex items-center gap-2 text-sm mt-2" style={{ color: 'var(--color-ink)' }}>
            <input
              type="checkbox"
              name="removeImage"
              checked={removeImage}
              onChange={(e) => {
                setRemoveImage(e.target.checked)
                setImagePreview(e.target.checked ? null : item?.image_url ?? null)
              }}
            />
            Remove current photo (shows initials instead)
          </label>
        )}
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="admin-input max-w-[120px]" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Lower numbers appear first.</p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible on the public site)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add testimonial' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
