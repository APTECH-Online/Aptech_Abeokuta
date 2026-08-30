'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateApplicationStatus, type ActionResult } from '../../app/admin/(dashboard)/applications/actions'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '../../types/db'

const initial: ActionResult = { ok: true }
const STATUS_ORDER: ApplicationStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
  'enrolled'
]

function Button() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-secondary btn-sm disabled:opacity-60">
      {pending ? 'Saving…' : 'Update'}
    </button>
  )
}

export default function ApplicationStatusForm({
  applicationId,
  leadId,
  currentStatus
}: {
  applicationId: string
  leadId: string
  currentStatus: ApplicationStatus
}) {
  const [state, formAction] = useActionState(updateApplicationStatus, initial)
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="leadId" value={leadId} />
      <select name="status" defaultValue={currentStatus} className="admin-select">
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
        ))}
      </select>
      <Button />
      {!state.ok && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{state.message}</span>}
    </form>
  )
}
