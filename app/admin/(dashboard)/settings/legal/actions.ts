'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireWebsiteContentAccess, requireRole, ForbiddenError, UnauthorizedError } from '../../../../../lib/auth'
import { logAudit } from '../../../../../lib/audit'
import { DEFAULT_LEGAL, LEGAL_SLUGS, type LegalSection, type LegalSlug } from '../../../../../data/legal'

export type ActionResult = { ok: true; id?: string } | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message || 'You do not have permission to do that.' }
  console.error('[crm] unexpected legal documents error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

const isSlug = (v: string): v is LegalSlug => (LEGAL_SLUGS as string[]).includes(v)

function revalidateLegal(slug: LegalSlug) {
  revalidatePath('/admin/settings/legal')
  revalidatePath(`/admin/settings/legal/${slug}`)
  revalidatePath(`/${slug}`)
}

/** Creates the next draft, copied from the live version (or the built-in default). Returns the existing draft if one is open. */
export async function startLegalDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireWebsiteContentAccess('edit')
    const slug = String(formData.get('slug') || '')
    if (!isSlug(slug)) return { ok: false, message: 'Unknown document.' }
    const admin = createAdminClient()

    const { data: rows } = await admin.from('legal_documents').select('id, version, status, title, summary, sections').eq('slug', slug).order('version', { ascending: false })
    const existingDraft = (rows ?? []).find((r: any) => r.status === 'draft')
    if (existingDraft) return { ok: true, id: existingDraft.id }

    const source: any = (rows ?? []).find((r: any) => r.status === 'published') ?? (rows ?? [])[0] ?? DEFAULT_LEGAL[slug]
    const nextVersion = ((rows ?? [])[0]?.version ?? 0) + 1
    const { data, error } = await admin
      .from('legal_documents')
      .insert({
        slug,
        version: nextVersion,
        status: 'draft',
        title: source.title,
        summary: source.summary ?? '',
        sections: source.sections,
        effective_date: new Date().toISOString().slice(0, 10),
        created_by: staff.id
      })
      .select('id')
      .single()
    if (error || !data) {
      console.error('[crm] failed to start legal draft', error)
      return { ok: false, message: 'Could not start a new draft.' }
    }
    await logAudit(admin, { userId: staff.id, action: 'legal.draft_created', entity: 'legal_document', entityId: data.id, metadata: { slug, version: nextVersion } })
    revalidateLegal(slug)
    return { ok: true, id: data.id }
  } catch (err) {
    return authError(err)
  }
}

function parseSections(raw: string): { sections: LegalSection[]; error?: string } {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return { sections: [], error: 'Sections could not be read. Please reload the page and try again.' } }
  if (!Array.isArray(parsed)) return { sections: [], error: 'Sections could not be read.' }
  const sections = parsed
    .map((s: any) => ({ heading: String(s?.heading ?? '').trim(), body: String(s?.body ?? '').trim() }))
    .filter((s) => s.heading || s.body)
  if (!sections.length) return { sections, error: 'Add at least one section.' }
  if (sections.length > 40) return { sections, error: 'A document can have at most 40 sections.' }
  const bad = sections.findIndex((s) => !s.heading || !s.body || s.heading.length > 200 || s.body.length > 8000)
  if (bad >= 0) return { sections, error: `Section ${bad + 1} needs a heading (max 200 characters) and body text (max 8,000 characters).` }
  return { sections }
}

export async function saveLegalDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireWebsiteContentAccess('edit')
    const id = String(formData.get('id') || '')
    const title = String(formData.get('title') || '').trim()
    const summary = String(formData.get('summary') || '').trim()
    const effectiveDate = String(formData.get('effectiveDate') || '').trim()
    const changeSummary = String(formData.get('changeSummary') || '').trim()

    const fieldErrors: Record<string, string> = {}
    if (!title) fieldErrors.title = 'Title is required.'
    else if (title.length > 200) fieldErrors.title = 'Keep the title under 200 characters.'
    if (summary.length > 1000) fieldErrors.summary = 'Keep the introduction under 1,000 characters.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) fieldErrors.effectiveDate = 'Choose an effective date.'
    if (changeSummary.length > 1000) fieldErrors.changeSummary = 'Keep this under 1,000 characters.'
    const { sections, error: sectionsError } = parseSections(String(formData.get('sections') || '[]'))
    if (sectionsError) fieldErrors.sections = sectionsError
    if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }

    const admin = createAdminClient()
    const { data: row } = await admin.from('legal_documents').select('id, slug, status').eq('id', id).maybeSingle()
    if (!row) return { ok: false, message: 'Draft not found.' }
    if (row.status !== 'draft') return { ok: false, message: 'Only drafts can be edited. Start a new draft instead.' }

    const { error } = await admin
      .from('legal_documents')
      .update({ title, summary: summary || null, effective_date: effectiveDate, change_summary: changeSummary || null, sections })
      .eq('id', id)
    if (error) {
      console.error('[crm] failed to save legal draft', error)
      return { ok: false, message: 'Could not save the draft.' }
    }
    await logAudit(admin, { userId: staff.id, action: 'legal.draft_saved', entity: 'legal_document', entityId: id, metadata: { slug: row.slug } })
    revalidateLegal(row.slug as LegalSlug)
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

/** Publishing changes what the public sees and which version consent records cite, so it is Super Admin only. */
export async function publishLegalDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const id = String(formData.get('id') || '')
    const admin = createAdminClient()
    const { data: draft } = await admin.from('legal_documents').select('id, slug, version, status, change_summary, sections').eq('id', id).maybeSingle()
    if (!draft || draft.status !== 'draft') return { ok: false, message: 'Draft not found.' }
    if (!draft.change_summary?.trim()) return { ok: false, message: 'Save the draft with a "What changed" note before publishing.', fieldErrors: { changeSummary: 'Describe what changed.' } }
    if (!Array.isArray(draft.sections) || !draft.sections.length) return { ok: false, message: 'A document needs at least one section.' }

    // Archive the live version first so the one-published-per-document index is never violated.
    const { error: archiveError } = await admin.from('legal_documents').update({ status: 'archived' }).eq('slug', draft.slug).eq('status', 'published')
    if (archiveError) { console.error('[crm] failed to archive legal doc', archiveError); return { ok: false, message: 'Could not publish.' } }
    const { error } = await admin.from('legal_documents').update({ status: 'published', published_at: new Date().toISOString(), published_by: staff.id }).eq('id', id)
    if (error) {
      console.error('[crm] failed to publish legal doc', error)
      return { ok: false, message: 'Could not publish. The previous version may need restoring; please check the history.' }
    }
    await logAudit(admin, { userId: staff.id, action: 'legal.published', entity: 'legal_document', entityId: id, metadata: { slug: draft.slug, version: draft.version } })
    revalidateLegal(draft.slug as LegalSlug)
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function discardLegalDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireWebsiteContentAccess('edit')
    const id = String(formData.get('id') || '')
    const admin = createAdminClient()
    const { data: row } = await admin.from('legal_documents').select('id, slug, status').eq('id', id).maybeSingle()
    if (!row || row.status !== 'draft') return { ok: false, message: 'Draft not found.' }
    const { error } = await admin.from('legal_documents').delete().eq('id', id)
    if (error) return { ok: false, message: 'Could not discard the draft.' }
    await logAudit(admin, { userId: staff.id, action: 'legal.draft_discarded', entity: 'legal_document', entityId: id, metadata: { slug: row.slug } })
    revalidateLegal(row.slug as LegalSlug)
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
