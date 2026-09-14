'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import FormAlert from '../shared/FormAlert'
import {
  createAffiliatedUniversity,
  updateAffiliatedUniversity,
  type ActionResult
} from '../../app/admin/(dashboard)/settings/partners/universities/actions'
import type { AffiliatedUniversity } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function AffiliatedUniversityForm({ mode, item }: { mode: 'create' | 'edit'; item?: AffiliatedUniversity }) {
  const action = mode === 'create' ? createAffiliatedUniversity : updateAffiliatedUniversity
  const [state, formAction] = useActionState(action, initial)
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  const [logoPreview, setLogoPreview] = useState<string | null>(item?.logo_url ?? null)

  return (
    <form action={formAction} className="grid gap-6 max-w-xl">
      {mode === 'edit' && item && <input type="hidden" name="itemId" value={item.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div>
        <label htmlFor="name" className="field-label">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          defaultValue={item?.name ?? ''}
          className="admin-input"
          placeholder="e.g. Bangor University"
        />
        {fieldErrors?.name && <p className="field-error">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="logo" className="field-label">
          Logo {mode === 'edit' && <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(leave blank to keep the current one)</span>}
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setLogoPreview(URL.createObjectURL(file))
          }}
          className="admin-input"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          A transparent PNG works best against the site's light and dark card backgrounds.
        </p>
        {fieldErrors?.logo && <p className="field-error">{fieldErrors.logo}</p>}
        {logoPreview && (
          <div className="mt-3 flex items-center justify-center w-full max-w-[220px] h-20 rounded-md border p-3" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
            <div className="relative w-full h-full">
              <Image src={logoPreview} alt="Logo preview" fill className="object-contain" unoptimized={logoPreview.startsWith('blob:')} />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="websiteUrl" className="field-label">Website (optional)</label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          maxLength={500}
          defaultValue={item?.website_url ?? ''}
          className="admin-input"
          placeholder="https://bangor.ac.uk"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          If set, the logo links out to this site. Leave blank to keep it static.
        </p>
        {fieldErrors?.websiteUrl && <p className="field-error">{fieldErrors.websiteUrl}</p>}
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="admin-input max-w-[120px]" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Lower numbers appear first in the logo grid.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible on the Home and About pages)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add university' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
