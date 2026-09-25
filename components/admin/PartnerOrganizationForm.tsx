'use client'

import { useActionState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import {
  createPartnerOrganization,
  updatePartnerOrganization,
  type ActionResult
} from '../../app/admin/(dashboard)/settings/partners/organizations/actions'
import type { PartnerOrganization } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function PartnerOrganizationForm({ mode, item }: { mode: 'create' | 'edit'; item?: PartnerOrganization }) {
  const action = mode === 'create' ? createPartnerOrganization : updatePartnerOrganization
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="grid gap-6 max-w-xl">
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
          placeholder="e.g. Avigo Investment Limited"
        />
        {fieldErrors?.title && <p className="field-error">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="body" className="field-label">Description</label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={1000}
          defaultValue={item?.body ?? ''}
          className="admin-input"
        />
        {fieldErrors?.body && <p className="field-error">{fieldErrors.body}</p>}
      </div>

      <div>
        <label htmlFor="points" className="field-label">Bullet points (optional)</label>
        <textarea
          id="points"
          name="points"
          rows={4}
          defaultValue={(item?.points ?? []).join('\n')}
          className="admin-input"
          placeholder={'One per line, e.g.\n100% Nigerian-Owned\nDiverse Team of Professionals'}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          One bullet per line. Up to 10.
        </p>
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="admin-input max-w-[120px]" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Lower numbers appear first.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible on the About page)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add partner' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
