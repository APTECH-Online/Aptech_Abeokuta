'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import FormAlert from '../shared/FormAlert'
import { useActionFeedback } from './AdminFeedbackProvider'
import {
  saveLegalDraft,
  startLegalDraft,
  publishLegalDraft,
  discardLegalDraft,
  type ActionResult
} from '../../app/admin/(dashboard)/settings/legal/actions'
import type { LegalSection } from '../../data/legal'

const initial: ActionResult = { ok: true }

function Submit({ children, pendingText, variant = 'btn-primary' }: { children: React.ReactNode; pendingText: string; variant?: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className={`btn ${variant} disabled:opacity-60`}>{pending ? pendingText : children}</button>
}

export function StartDraftButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter()
  const [state, action] = useActionState(async (p: ActionResult, fd: FormData) => {
    const r = await startLegalDraft(p, fd)
    if (r.ok) router.refresh()
    return r
  }, initial)
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="slug" value={slug} />
      {!state.ok && <FormAlert variant="error" title={state.message} />}
      <div><Submit pendingText="Starting…">{label}</Submit></div>
    </form>
  )
}

export default function LegalEditor({
  draft,
  canPublish
}: {
  draft: { id: string; title: string; summary: string; effective_date: string; change_summary: string; sections: LegalSection[] }
  canPublish: boolean
}) {
  const router = useRouter()
  const [sections, setSections] = useState<LegalSection[]>(draft.sections?.length ? draft.sections : [{ heading: '', body: '' }])
  const [saveState, saveAction] = useActionState(saveLegalDraft, initial)
  const [pubState, pubAction] = useActionState(async (p: ActionResult, fd: FormData) => {
    const r = await publishLegalDraft(p, fd)
    if (r.ok) router.refresh()
    return r
  }, initial)
  const [discardState, discardAction] = useActionState(async (p: ActionResult, fd: FormData) => {
    const r = await discardLegalDraft(p, fd)
    if (r.ok) router.refresh()
    return r
  }, initial)
  useActionFeedback(saveState, 'Draft saved.')
  useActionFeedback(pubState, 'Published. The public page and new consent records now use this version.')
  const fe = !saveState.ok ? saveState.fieldErrors : undefined

  const update = (i: number, patch: Partial<LegalSection>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const move = (i: number, dir: -1 | 1) => setSections((s) => {
    const j = i + dir
    if (j < 0 || j >= s.length) return s
    const copy = [...s]; [copy[i], copy[j]] = [copy[j], copy[i]]
    return copy
  })

  return (
    <div className="grid gap-6">
      <form action={saveAction} className="grid gap-6">
        <input type="hidden" name="id" value={draft.id} />
        <input type="hidden" name="sections" value={JSON.stringify(sections)} />
        {!saveState.ok && saveState.message && <FormAlert variant="error" title={saveState.message} />}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="legal-title" className="field-label">Title</label>
            <input id="legal-title" name="title" required maxLength={200} defaultValue={draft.title} className="admin-input" />
            {fe?.title && <p className="field-error">{fe.title}</p>}
          </div>
          <div>
            <label htmlFor="legal-date" className="field-label">Effective date</label>
            <input id="legal-date" name="effectiveDate" type="date" required defaultValue={draft.effective_date} className="admin-input" />
            {fe?.effectiveDate && <p className="field-error">{fe.effectiveDate}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="legal-summary" className="field-label">Introduction (shown under the title)</label>
            <textarea id="legal-summary" name="summary" rows={3} maxLength={1000} defaultValue={draft.summary} className="admin-input" />
            {fe?.summary && <p className="field-error">{fe.summary}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="legal-change" className="field-label">What changed in this version</label>
            <textarea id="legal-change" name="changeSummary" rows={2} maxLength={1000} defaultValue={draft.change_summary} className="admin-input" placeholder="Required to publish, e.g. Added a section on WhatsApp communications." />
            {fe?.changeSummary && <p className="field-error">{fe.changeSummary}</p>}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Sections</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Separate paragraphs with a blank line. Start a line with <code>- </code> for a bullet. Use <code>{'{{email}}'}</code>, <code>{'{{phone}}'}</code> and <code>{'{{address}}'}</code> to insert the live contact details.
              </p>
            </div>
          </div>
          {fe?.sections && <FormAlert variant="error" title={fe.sections} />}
          {sections.map((s, i) => (
            <fieldset key={i} className="rounded-xl p-4 grid gap-3" style={{ border: '1px solid var(--color-line)' }}>
              <legend className="px-1 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Section {i + 1}</legend>
              <input aria-label={`Section ${i + 1} heading`} value={s.heading} onChange={(e) => update(i, { heading: e.target.value })} maxLength={200} className="admin-input" placeholder="Heading" />
              <textarea aria-label={`Section ${i + 1} body`} value={s.body} onChange={(e) => update(i, { body: e.target.value })} rows={Math.min(14, Math.max(4, s.body.split('\n').length + 1))} maxLength={8000} className="admin-input" placeholder="Body text" />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move section ${i + 1} up`}><ArrowUp size={14} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label={`Move section ${i + 1} down`}><ArrowDown size={14} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSections((all) => all.filter((_, j) => j !== i))} disabled={sections.length === 1} aria-label={`Remove section ${i + 1}`}><Trash2 size={14} aria-hidden="true" /> Remove</button>
              </div>
            </fieldset>
          ))}
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSections((s) => [...s, { heading: '', body: '' }])}><Plus size={14} aria-hidden="true" /> Add section</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3"><Submit pendingText="Saving…">Save draft</Submit></div>
      </form>

      <div className="grid gap-4 pt-5" style={{ borderTop: '1px solid var(--color-line)' }}>
        {!pubState.ok && <FormAlert variant="error" title={pubState.message} />}
        {!discardState.ok && <FormAlert variant="error" title={discardState.message} />}
        <div className="flex flex-wrap gap-3">
          {canPublish ? (
            <form action={pubAction}>
              <input type="hidden" name="id" value={draft.id} />
              <Submit pendingText="Publishing…" variant="btn-accent">Publish this version</Submit>
            </form>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Only a Super Admin can publish. Save your draft and ask them to review it.</p>
          )}
          <form action={discardAction} onSubmit={(e) => { if (!confirm('Discard this draft? This cannot be undone.')) e.preventDefault() }}>
            <input type="hidden" name="id" value={draft.id} />
            <Submit pendingText="Discarding…" variant="btn-ghost">Discard draft</Submit>
          </form>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Save your draft before publishing: publishing uses the last saved version.</p>
      </div>
    </div>
  )
}
