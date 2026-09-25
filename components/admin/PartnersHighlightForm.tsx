'use client'

import { useActionState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { updatePartnersHighlight, type ActionResult } from '../../app/admin/(dashboard)/settings/partners/actions'
import type { PartnersHighlight } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

export default function PartnersHighlightForm({ highlight }: { highlight: PartnersHighlight | null }) {
  const [state, formAction] = useActionState(updatePartnersHighlight, initial)
  useActionFeedback(state, 'Update partners highlight completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="grid gap-6 max-w-xl">
      <input type="hidden" name="highlightId" value={highlight?.id ?? ''} />

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}
      {state.ok && state !== initial && <p className="text-sm" style={{ color: 'var(--color-success)' }}>Saved.</p>}

      <div>
        <label htmlFor="headline" className="field-label">Headline</label>
        <input
          id="headline"
          name="headline"
          type="text"
          required
          maxLength={300}
          defaultValue={highlight?.headline ?? ''}
          className="admin-input"
          placeholder="Backed by Avigo Investment Limited, connected to Middlesex & Portsmouth Universities"
        />
        {fieldErrors?.headline && <p className="field-error">{fieldErrors.headline}</p>}
      </div>

      <div>
        <label htmlFor="description" className="field-label">Description</label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          maxLength={500}
          defaultValue={highlight?.description ?? ''}
          className="admin-input"
        />
        {fieldErrors?.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ctaLabel" className="field-label">Button label</label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            type="text"
            required
            maxLength={60}
            defaultValue={highlight?.cta_label ?? ''}
            className="admin-input"
            placeholder="Meet our partners"
          />
          {fieldErrors?.ctaLabel && <p className="field-error">{fieldErrors.ctaLabel}</p>}
        </div>
        <div>
          <label htmlFor="ctaHref" className="field-label">Button link</label>
          <input
            id="ctaHref"
            name="ctaHref"
            type="text"
            required
            maxLength={300}
            defaultValue={highlight?.cta_href ?? ''}
            className="admin-input"
            placeholder="/about#partners"
          />
          {fieldErrors?.ctaHref && <p className="field-error">{fieldErrors.ctaHref}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={highlight?.is_published ?? true} />
        Published (visible on the homepage)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
