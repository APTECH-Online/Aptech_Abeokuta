'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteLead } from '../../app/admin/(dashboard)/leads/[id]/actions'
import { deleteApplication, type ActionResult as ApplicationActionResult } from '../../app/admin/(dashboard)/applications/actions'
import { deleteFollowUp, type ActionResult } from '../../app/admin/(dashboard)/leads/[id]/actions'

const initial: ActionResult = { ok: true }
const applicationInitial: ApplicationActionResult = { ok: true }

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-ghost btn-sm disabled:opacity-60"
      style={{ color: 'var(--color-danger)' }}
    >
      {pending ? 'Deleting…' : label}
    </button>
  )
}

type DeleteState = { ok: true } | { ok: false; message: string }

function ErrorText({ state }: { state: DeleteState }) {
  if (state.ok) return null
  return <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>
}

export function DeleteLeadButton({ leadId, name }: { leadId: string; name: string }) {
  const [state, formAction] = useActionState(deleteLead, initial)
  return (
    <form action={formAction} onSubmit={(e) => {
      if (!window.confirm(`Permanently delete enquiry for ${name}? This also deletes its applications, follow-ups and activity history. This cannot be undone.`)) e.preventDefault()
    }}>
      <input type="hidden" name="leadId" value={leadId} />
      <DeleteButton label="Delete enquiry" />
      <ErrorText state={state} />
    </form>
  )
}

export function DeleteApplicationButton({ applicationId, reference }: { applicationId: string; reference: string }) {
  const [state, formAction] = useActionState(deleteApplication, applicationInitial)
  return (
    <form action={formAction} onSubmit={(e) => {
      if (!window.confirm(`Permanently delete application ${reference}? This cannot be undone.`)) e.preventDefault()
    }}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <DeleteButton label="Delete" />
      <ErrorText state={state} />
    </form>
  )
}

export function DeleteFollowUpButton({ followUpId }: { followUpId: string }) {
  const [state, formAction] = useActionState(deleteFollowUp, initial)
  return (
    <form action={formAction} onSubmit={(e) => {
      if (!window.confirm('Permanently delete this follow-up? This cannot be undone.')) e.preventDefault()
    }}>
      <input type="hidden" name="followUpId" value={followUpId} />
      <DeleteButton label="Delete" />
      <ErrorText state={state} />
    </form>
  )
}
