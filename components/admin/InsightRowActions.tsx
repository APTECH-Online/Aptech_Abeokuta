'use client'

import { useActionState } from 'react'
import { useAdminFeedback } from './AdminFeedbackProvider'
import { useActionFeedback } from './AdminFeedbackProvider'
import Link from 'next/link'
import {
  publishInsightNow,
  archiveInsight,
  restoreInsightToDraft,
  toggleInsightFeatured,
  deleteInsight,
  type ActionResult
} from '../../app/admin/(dashboard)/insights/actions'
import type { InsightRow } from '../../lib/crm/insights'

const initial: ActionResult = { ok: true }

function QuickActionForm({
  action,
  insightId,
  label,
  extra,
  className = 'btn btn-ghost btn-sm'
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>
  insightId: string
  label: string
  extra?: Record<string, string>
  className?: string
}) {
  const [state, formAction] = useActionState(action, initial)
  useActionFeedback(state, 'Action completed successfully.')
  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="insightId" value={insightId} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={className}>{label}</button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

function DeleteActionForm({ insightId, title }: { insightId: string; title: string }) {
  const { confirm } = useAdminFeedback()
  const [state, formAction] = useActionState(deleteInsight, initial)
  return (
    <form
      action={formAction}
      className="inline-block"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const accepted = await confirm({ title: 'Delete insight?', message: `Permanently delete \"${title}\"? This cannot be undone.`, confirmLabel: 'Delete', danger: true })
        if (accepted) form.requestSubmit()
      }}
    >
      <input type="hidden" name="insightId" value={insightId} />
      <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
        Delete
      </button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

export interface InsightRowActionPermissions {
  edit: boolean
  publish: boolean
  unpublish: boolean
  delete: boolean
}

export default function InsightRowActions({ insight, actions }: { insight: InsightRow; actions: InsightRowActionPermissions }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/insights/${insight.id}/preview`} className="btn btn-ghost btn-sm">Preview</Link>

      {actions.edit && <Link href={`/admin/insights/${insight.id}`} className="btn btn-secondary btn-sm">Edit</Link>}

      {actions.publish && (insight.status === 'draft' || insight.status === 'scheduled') && (
        <QuickActionForm action={publishInsightNow} insightId={insight.id} label="Publish now" className="btn btn-primary btn-sm" />
      )}

      {actions.unpublish && (insight.status === 'published' || insight.status === 'scheduled') && (
        <QuickActionForm action={archiveInsight} insightId={insight.id} label="Archive" />
      )}

      {actions.edit && insight.status === 'archived' && (
        <QuickActionForm action={restoreInsightToDraft} insightId={insight.id} label="Restore to draft" />
      )}

      {actions.delete && (insight.status === 'draft' || insight.status === 'archived') && (
        <DeleteActionForm insightId={insight.id} title={insight.title} />
      )}

      {actions.edit && insight.status === 'published' && (
        <QuickActionForm
          action={toggleInsightFeatured}
          insightId={insight.id}
          label={insight.is_featured ? 'Unfeature' : 'Feature'}
          extra={{ nextValue: (!insight.is_featured).toString() }}
        />
      )}
    </div>
  )
}
