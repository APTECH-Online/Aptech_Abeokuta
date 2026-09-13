'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FormAlert from '../shared/FormAlert'
import { createGalleryItem, updateGalleryItem, type ActionResult } from '../../app/admin/(dashboard)/gallery/actions'
import { GALLERY_CATEGORIES, GALLERY_DISPLAY_SIZE_LABELS } from '../../types/db'
import type { GalleryItem, GalleryDisplaySize } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function GalleryForm({ mode, item }: { mode: 'create' | 'edit'; item?: GalleryItem }) {
  const action = mode === 'create' ? createGalleryItem : updateGalleryItem
  const [state, formAction] = useActionState(action, initial)
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  const router = useRouter()

  useEffect(() => {
    if (mode === 'create' && state.ok && 'id' in state && state.id) {
      router.push('/admin/gallery?created=1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)
  const [category, setCategory] = useState(item?.category ?? GALLERY_CATEGORIES[0])
  const [customCategory, setCustomCategory] = useState(!GALLERY_CATEGORIES.includes(category as any))

  return (
    <form action={formAction} className="grid gap-6 max-w-2xl">
      {mode === 'edit' && item && <input type="hidden" name="itemId" value={item.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={item?.title ?? ''}
          className="admin-input"
          placeholder="e.g. Career Quest, 16th edition"
        />
        {fieldErrors?.title && <p className="field-error">{fieldErrors.title}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          {!customCategory ? (
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomCategory(true)
                  setCategory('')
                } else {
                  setCategory(e.target.value)
                }
              }}
              className="admin-select"
            >
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">New category…</option>
            </select>
          ) : (
            <input
              id="category"
              name="category"
              type="text"
              required
              autoFocus
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-input"
              placeholder="Type a new category"
            />
          )}
          {fieldErrors?.category && <p className="field-error">{fieldErrors.category}</p>}
        </div>

        <div>
          <label htmlFor="displaySize" className="field-label">Layout size</label>
          <select
            id="displaySize"
            name="displaySize"
            defaultValue={item?.display_size ?? ('standard' as GalleryDisplaySize)}
            className="admin-select"
          >
            {(Object.keys(GALLERY_DISPLAY_SIZE_LABELS) as GalleryDisplaySize[]).map((size) => (
              <option key={size} value={size}>{GALLERY_DISPLAY_SIZE_LABELS[size]}</option>
            ))}
          </select>
          {fieldErrors?.displaySize && <p className="field-error">{fieldErrors.displaySize}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="altText" className="field-label">Alt text</label>
        <input
          id="altText"
          name="altText"
          type="text"
          required
          maxLength={300}
          defaultValue={item?.alt_text ?? ''}
          className="admin-input"
          placeholder="Describe the photo for screen readers and SEO"
        />
        {fieldErrors?.altText && <p className="field-error">{fieldErrors.altText}</p>}
      </div>

      <div>
        <label htmlFor="image" className="field-label">
          Photo {mode === 'edit' && <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(leave blank to keep the current one)</span>}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setImagePreview(URL.createObjectURL(file))
          }}
          className="admin-input"
        />
        {fieldErrors?.image && <p className="field-error">{fieldErrors.image}</p>}
        {imagePreview && (
          <div className="mt-3 relative w-full max-w-xs aspect-video rounded-md overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={imagePreview.startsWith('blob:')} />
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className="admin-input max-w-[120px]"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Lower numbers appear first in the public gallery grid.</p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible on the public Gallery page)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add photo' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
