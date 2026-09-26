'use client'

import { useActionState } from 'react'
import { useAdminFeedback } from './AdminFeedbackProvider'
import { useActionFeedback } from './AdminFeedbackProvider'
import Link from 'next/link'
import { toggleFaqPublished, deleteFaq, type ActionResult } from '../../app/admin/(dashboard)/faqs/actions'
import type { Faq } from '../../types/db'

const initial: ActionResult = { ok: true }

function ToggleForm({ item }: { item: Faq }) {
  const [toggleState, formAction, pending] = useActionState(toggleFaqPublished, initial)
  useActionFeedback(toggleState, 'Toggle faq published completed successfully.')
  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="nextValue" value={(!item.is_published).toString()} />
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>
        {pending ? 'Updating…' : item.is_published ? 'Unpublish' : 'Publish'}
      </button>
    </form>
  )
}

function DeleteForm({ item }: { item: Faq }) {
  const { confirm } = useAdminFeedback()
  const [state, formAction] = useActionState(deleteFaq, initial)
  useActionFeedback(state, 'Delete faq completed successfully.')
  return (
    <form
      action={formAction}
      onSubmit={async (e) => {
        e.preventDefault()
        const accepted = await confirm({ title: 'Delete FAQ?', message: 'This action is permanent and cannot be undone.', confirmLabel: 'Delete', danger: true })
        if (accepted) e.currentTarget.requestSubmit()
      }}
    >
      <input type="hidden" name="itemId" value={item.id} />
      <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
        Delete
      </button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

export default function FaqRowActions({ item, canManage }: { item: Faq; canManage: boolean }) {
  if (!canManage) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/admin/faqs/${item.id}`} className="btn btn-ghost btn-sm">Edit</Link>
      <ToggleForm item={item} />
      <DeleteForm item={item} />
    </div>
  )
}
