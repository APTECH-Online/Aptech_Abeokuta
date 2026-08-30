'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateFollowUpStatus } from '../../app/admin/(dashboard)/leads/[id]/actions'
import type { ActionResult } from '../../app/admin/(dashboard)/leads/[id]/actions'

const initial: ActionResult = { ok: true }

function Button({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-ghost btn-sm disabled:opacity-60">
      {pending ? '…' : children}
    </button>
  )
}

export default function FollowUpStatusForm({ followUpId, leadId }: { followUpId: string; leadId: string }) {
  const [completeState, completeAction] = useActionState(updateFollowUpStatus, initial)
  const [cancelState, cancelAction] = useActionState(updateFollowUpStatus, initial)

  return (
    <div className="flex items-center gap-1.5">
      <form action={completeAction}>
        <input type="hidden" name="followUpId" value={followUpId} />
        <input type="hidden" name="leadId" value={leadId} />
        <input type="hidden" name="status" value="completed" />
        <Button>Mark done</Button>
      </form>
      <form action={cancelAction}>
        <input type="hidden" name="followUpId" value={followUpId} />
        <input type="hidden" name="leadId" value={leadId} />
        <input type="hidden" name="status" value="cancelled" />
        <Button>Cancel</Button>
      </form>
      {(!completeState.ok || !cancelState.ok) && (
        <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {!completeState.ok ? completeState.message : !cancelState.ok ? cancelState.message : ''}
        </span>
      )}
    </div>
  )
}
