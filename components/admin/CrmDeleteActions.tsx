'use client'

import { useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteLead } from '../../app/admin/(dashboard)/leads/[id]/actions'
import { deleteApplication, type ActionResult as ApplicationActionResult } from '../../app/admin/(dashboard)/applications/actions'
import { deleteFollowUp, type ActionResult } from '../../app/admin/(dashboard)/leads/[id]/actions'
import { useActionFeedback, useAdminFeedback } from './AdminFeedbackProvider'

const initial: ActionResult = { ok: true }
const applicationInitial: ApplicationActionResult = { ok: true }

type DeleteState = { ok: true } | { ok: false; message: string }

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-ghost btn-sm disabled:opacity-60" style={{ color: 'var(--color-danger)' }}>
      {pending ? 'Deleting…' : label}
    </button>
  )
}

function ErrorText({ state }: { state: DeleteState }) {
  if (state.ok) return null
  return <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>
}

export function DeleteLeadButton({ leadId, name }: { leadId: string; name: string }) {
  const [state, formAction] = useActionState(deleteLead, initial)
  const { confirm } = useAdminFeedback()
  const confirmed = useRef(false)
  useActionFeedback(state, 'Enquiry deleted successfully.')
  return (
    <form action={formAction} onSubmit={async (event) => {
      if (confirmed.current) { confirmed.current = false; return }
      event.preventDefault()
      const form = event.currentTarget
      const accepted = await confirm({
        title: 'Delete this enquiry?',
        message: `Permanently delete the enquiry for ${name}? This will also remove its related applications, follow-ups and activity history. This action cannot be undone.`,
        confirmLabel: 'Delete enquiry',
        danger: true
      })
      if (accepted) { confirmed.current = true; form.requestSubmit() }
    }}>
      <input type="hidden" name="leadId" value={leadId} />
      <DeleteButton label="Delete enquiry" />
      <ErrorText state={state} />
    </form>
  )
}

export function DeleteApplicationButton({ applicationId, reference }: { applicationId: string; reference: string }) {
  const [state, formAction] = useActionState(deleteApplication, applicationInitial)
  const { confirm } = useAdminFeedback()
  const confirmed = useRef(false)
  useActionFeedback(state, 'Application deleted successfully.')
  return (
    <form action={formAction} onSubmit={async (event) => {
      if (confirmed.current) { confirmed.current = false; return }
      event.preventDefault()
      const form = event.currentTarget
      const accepted = await confirm({ title: 'Delete this application?', message: `Permanently delete application ${reference}? This action cannot be undone.`, confirmLabel: 'Delete application', danger: true })
      if (accepted) { confirmed.current = true; form.requestSubmit() }
    }}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <DeleteButton label="Delete" />
      <ErrorText state={state} />
    </form>
  )
}

export function DeleteFollowUpButton({ followUpId }: { followUpId: string }) {
  const [state, formAction] = useActionState(deleteFollowUp, initial)
  const { confirm } = useAdminFeedback()
  const confirmed = useRef(false)
  useActionFeedback(state, 'Follow-up deleted successfully.')
  return (
    <form action={formAction} onSubmit={async (event) => {
      if (confirmed.current) { confirmed.current = false; return }
      event.preventDefault()
      const form = event.currentTarget
      const accepted = await confirm({ title: 'Delete this follow-up?', message: 'Permanently delete this follow-up? This action cannot be undone.', confirmLabel: 'Delete follow-up', danger: true })
      if (accepted) { confirmed.current = true; form.requestSubmit() }
    }}>
      <input type="hidden" name="followUpId" value={followUpId} />
      <DeleteButton label="Delete" />
      <ErrorText state={state} />
    </form>
  )
}
