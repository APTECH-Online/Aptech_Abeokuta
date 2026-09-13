'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { createFaq, updateFaq, type ActionResult } from '../../app/admin/(dashboard)/faqs/actions'
import type { Faq } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function FaqForm({ mode, item }: { mode: 'create' | 'edit'; item?: Faq }) {
  const action = mode === 'create' ? createFaq : updateFaq
  const [state, formAction] = useActionState(action, initial)
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="grid gap-6 max-w-2xl">
      {mode === 'edit' && item && <input type="hidden" name="itemId" value={item.id} />}

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div>
        <label htmlFor="question" className="field-label">Question</label>
        <input
          id="question"
          name="question"
          type="text"
          required
          maxLength={300}
          defaultValue={item?.question ?? ''}
          className="admin-input"
          placeholder="e.g. Do I need prior IT experience to enrol?"
        />
        {fieldErrors?.question && <p className="field-error">{fieldErrors.question}</p>}
      </div>

      <div>
        <label htmlFor="answer" className="field-label">Answer</label>
        <textarea
          id="answer"
          name="answer"
          required
          rows={5}
          maxLength={2000}
          defaultValue={item?.answer ?? ''}
          className="admin-input"
          placeholder="The answer shown under this question"
        />
        {fieldErrors?.answer && <p className="field-error">{fieldErrors.answer}</p>}
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="sortOrder" className="field-label">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="admin-input max-w-[120px]" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Lower numbers appear first. The Admissions page only shows the first 3, in this order.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="isPublished" defaultChecked={item?.is_published ?? true} />
        Published (visible on the public site)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Add FAQ' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
