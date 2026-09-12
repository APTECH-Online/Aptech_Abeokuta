'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  publishInsightNow,
  archiveInsight,
  restoreInsightToDraft,
  toggleInsightFeatured,
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
  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="insightId" value={insightId} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={className}>{label}</button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

export default function InsightRowActions({ insight, canManage }: { insight: InsightRow; canManage: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/insights/${insight.id}/preview`} className="btn btn-ghost btn-sm">Preview</Link>

      {canManage && (
        <>
          <Link href={`/admin/insights/${insight.id}`} className="btn btn-secondary btn-sm">Edit</Link>

          {(insight.status === 'draft' || insight.status === 'scheduled') && (
            <QuickActionForm action={publishInsightNow} insightId={insight.id} label="Publish now" className="btn btn-primary btn-sm" />
          )}

          {(insight.status === 'published' || insight.status === 'scheduled') && (
            <QuickActionForm action={archiveInsight} insightId={insight.id} label="Archive" />
          )}

          {insight.status === 'archived' && (
            <QuickActionForm action={restoreInsightToDraft} insightId={insight.id} label="Restore to draft" />
          )}

          {insight.status === 'published' && (
            <QuickActionForm
              action={toggleInsightFeatured}
              insightId={insight.id}
              label={insight.is_featured ? 'Unfeature' : 'Feature'}
              extra={{ nextValue: (!insight.is_featured).toString() }}
            />
          )}
        </>
      )}
    </div>
  )
}
