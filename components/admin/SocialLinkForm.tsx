'use client'

import { useActionState, useState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { createSocialLink, updateSocialLink, type ActionResult } from '../../app/admin/(dashboard)/settings/social/actions'
import { SOCIAL_PLATFORMS } from '../../lib/social-platforms'
import type { SocialLink } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function SocialLinkForm({ mode, item }: { mode: 'create' | 'edit'; item?: SocialLink }) {
  const action = mode === 'create' ? createSocialLink : updateSocialLink
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  const [platform, setPlatform] = useState(item?.platform ?? 'facebook')

  return (
    <form action={formAction} className="grid gap-6 max-w-xl">
      {mode === 'edit' && item && <input type="hidden" name="itemId" value={item.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div>
        <label htmlFor="platform" className="field-label">Platform</label>
        <select
          id="platform"
          name="platform"
          required
          className="admin-select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as typeof platform)}
        >
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {fieldErrors?.platform && <p className="field-error">{fieldErrors.platform}</p>}
      </div>

      <div>
        <label htmlFor="label" className="field-label">
          Label {platform === 'other' ? '' : '(optional)'}
        </label>
        <input
          id="label"
          name="label"
          type="text"
          maxLength={100}
          defaultValue={item?.label ?? ''}
          className="admin-input"
          placeholder={platform === 'other' ? 'e.g. Threads' : 'Defaults to the platform name shown above'}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          {platform === 'other'
            ? 'Required for "Other" links — shown as the icon\'s accessible name on the public site.'
            : 'Leave blank to use the platform name as the accessible label for this icon.'}
        </p>
        {fieldErrors?.label && <p className="field-error">{fieldErrors.label}</p>}
      </div>

      <div>
        <label htmlFor="url" className="field-label">Link</label>
        <input
          id="url"
          name="url"
          type="url"
          required
          maxLength={500}
          defaultValue={item?.url ?? ''}
          className="admin-input"
          placeholder="https://facebook.com/yourpage"
        />
        {fieldErrors?.url && <p className="field-error">{fieldErrors.url}</p>}
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="admin-input max-w-[120px]" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Lower numbers appear first in the footer.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible in the site footer)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add link' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
