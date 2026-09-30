'use server'

import { randomUUID } from 'crypto'
import { RESERVED_INSIGHT_SLUGS, resolveSeoFields } from '../../../../lib/seo'
import { recordSlugChange } from '../../../../lib/seo-redirects'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireInsightsAccess, insightPermissionModule, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions'
import { logAudit } from '../../../../lib/audit'
import { insightFormSchema, formatZodErrors, slugify } from '../../../../lib/validation'
import { sanitizeInsightHtml } from '../../../../lib/sanitize-html'
import { uploadInsightImage, deleteInsightImageByUrl } from '../../../../lib/supabase/insights-storage'
import { isSlugTaken } from '../../../../lib/crm/insights'
import type { InsightContentType, Staff } from '../../../../types/db'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected insights error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

/**
 * Every mutation below must check the permission for the SPECIFIC content
 * type being written (news vs events), not just "some insight access" —
 * otherwise a Content Manager granted only News could create/publish/delete
 * an Event by submitting contentType=event on the form. Throws
 * ForbiddenError (caught by authError above) when the check fails.
 */
async function requireInsightPermission(contentType: InsightContentType | string, action: 'create' | 'edit' | 'publish' | 'unpublish' | 'delete'): Promise<Staff> {
  return requireInsightsAccess(contentType, action)
}

function revalidateInsightPaths(slug?: string, oldSlug?: string) {
  revalidatePath('/admin/insights')
  revalidatePath('/admin')
  revalidatePath('/insights')
  revalidatePath('/insights/news')
  revalidatePath('/insights/blog')
  revalidatePath('/insights/announcements')
  revalidatePath('/insights/events')
  revalidatePath('/sitemap.xml') // new/changed/unpublished content must reach the sitemap immediately
  revalidatePath('/')
  if (slug) revalidatePath(`/insights/${slug}`)
  if (oldSlug && oldSlug !== slug) revalidatePath(`/insights/${oldSlug}`)
}

/**
 * Shared parse + status/date resolution for create & update. `intent`
 * drives which status the record ends up with: draft / publish now /
 * schedule. Publishing and scheduling both require an authorised Content
 * Manager — enforced by requireInsightsAccess() in the callers, not here.
 */
function resolveStatusAndDates(intent: string, values: { publishAt?: string; expiresAt?: string }) {
  const publishAtDate = values.publishAt ? new Date(values.publishAt) : null
  const expiresAtDate = values.expiresAt ? new Date(values.expiresAt) : null
  const now = new Date()

  if (intent === 'publish') {
    return {
      status: 'published' as const,
      publish_at: (publishAtDate ?? now).toISOString(),
      expires_at: expiresAtDate ? expiresAtDate.toISOString() : null
    }
  }
  if (intent === 'schedule') {
    return {
      status: 'scheduled' as const,
      publish_at: publishAtDate ? publishAtDate.toISOString() : now.toISOString(),
      expires_at: expiresAtDate ? expiresAtDate.toISOString() : null
    }
  }
  // draft
  return {
    status: 'draft' as const,
    publish_at: publishAtDate ? publishAtDate.toISOString() : null,
    expires_at: expiresAtDate ? expiresAtDate.toISOString() : null
  }
}

export async function createInsight(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const raw = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    const parsed = insightFormSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const intent = String(formData.get('intent') || 'draft')
    if (intent === 'schedule' && !parsed.data.publishAt) {
      return { ok: false, message: 'Choose a publish date to schedule this.', fieldErrors: { publishAt: 'Required to schedule' } }
    }

    // Gate on the module the submitted content type belongs to (News vs
    // Events), not just "can create insights in general" — a Content
    // Manager granted only one of the two must not create the other.
    const staff = await requireInsightPermission(parsed.data.contentType, 'create')
    if ((intent === 'publish' || intent === 'schedule') && !(staff.role === 'super_admin' || hasPermission(staff, `${insightPermissionModule(parsed.data.contentType)}.publish`))) {
      return { ok: false, message: "You don't have permission to publish this." }
    }

    // Never save an insight without a SEO title + meta description: anything the
    // editor leaves blank is generated from its own title / short description / body.
    const seo = resolveSeoFields(
      'insight',
      { title: parsed.data.title, summary: parsed.data.shortDescription, contentHtml: parsed.data.content },
      parsed.data
    )
    const slug = slugify(parsed.data.slug || parsed.data.title)
    if (!slug) return { ok: false, message: 'Could not generate a valid slug from that title.' }
    if (RESERVED_INSIGHT_SLUGS.includes(slug)) {
      return { ok: false, message: 'That slug is reserved for a section page.', fieldErrors: { slug: 'Reserved — try another' } }
    }
    if (await isSlugTaken(slug)) {
      return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use — try another' } }
    }

    const id = randomUUID()
    const admin = createAdminClient()

    let featuredImageUrl: string | null = null
    const imageFile = formData.get('featuredImage')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadInsightImage(imageFile, id)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { featuredImage: result.error } }
      featuredImageUrl = result.url
    }

    const { status, publish_at, expires_at } = resolveStatusAndDates(intent, parsed.data)

    const { error } = await admin.from('insights').insert({
      id,
      title: parsed.data.title,
      slug,
      short_description: parsed.data.shortDescription || null,
      content: sanitizeInsightHtml(parsed.data.content),
      featured_image: featuredImageUrl,
      category: parsed.data.category,
      content_type: parsed.data.contentType as InsightContentType,
      author_id: staff.id,
      status,
      is_featured: parsed.data.isFeatured === 'on',
      publish_at,
      expires_at,
      seo_title: seo.seo_title,
      seo_description: seo.seo_description,
      seo_noindex: parsed.data.seoNoindex === 'on',
      event_start_at: parsed.data.eventStartAt ? new Date(parsed.data.eventStartAt).toISOString() : null,
      event_end_at: parsed.data.eventEndAt ? new Date(parsed.data.eventEndAt).toISOString() : null,
      event_venue: parsed.data.eventVenue || null,
      event_registration_url: parsed.data.eventRegistrationUrl || null,
      event_contact: parsed.data.eventContact || null
    })

    if (error) {
      console.error('[crm] failed to create insight', error)
      if (error.code === '23505') return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use' } }
      return { ok: false, message: 'Could not create the insight.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: status === 'published' ? 'insight.created_published' : status === 'scheduled' ? 'insight.created_scheduled' : 'insight.created',
      entity: 'insight',
      entityId: id,
      metadata: { title: parsed.data.title, status, contentType: parsed.data.contentType }
    })

    revalidateInsightPaths(slug)
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateInsight(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const insightId = String(formData.get('insightId') || '')
    if (!insightId) return { ok: false, message: 'Missing insight.' }

    const raw = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    const parsed = insightFormSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const intent = String(formData.get('intent') || 'draft')
    if (intent === 'schedule' && !parsed.data.publishAt) {
      return { ok: false, message: 'Choose a publish date to schedule this.', fieldErrors: { publishAt: 'Required to schedule' } }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('insights')
      .select('id, slug, featured_image, content_type')
      .eq('id', insightId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This insight no longer exists.' }

    // Must be able to edit both the record's current module AND, if the
    // content type is being changed, the module it's moving into — otherwise
    // a Content Manager could use an edit to relabel an Event they can't
    // touch into a News item, or move a News item into Events they lack.
    const staff = await requireInsightPermission(existing.content_type, 'edit')
    if (existing.content_type !== parsed.data.contentType) {
      const canEditTarget = staff.role === 'super_admin' || hasPermission(staff, `${insightPermissionModule(parsed.data.contentType)}.edit`)
      if (!canEditTarget) return { ok: false, message: "You don't have permission to move this into that content type." }
    }
    if ((intent === 'publish' || intent === 'schedule') && !(staff.role === 'super_admin' || hasPermission(staff, `${insightPermissionModule(parsed.data.contentType)}.publish`))) {
      return { ok: false, message: "You don't have permission to publish this." }
    }

    // Never save an insight without a SEO title + meta description: anything the
    // editor leaves blank is generated from its own title / short description / body.
    const seo = resolveSeoFields(
      'insight',
      { title: parsed.data.title, summary: parsed.data.shortDescription, contentHtml: parsed.data.content },
      parsed.data
    )
    const slug = slugify(parsed.data.slug || parsed.data.title)
    if (!slug) return { ok: false, message: 'Could not generate a valid slug from that title.' }
    if (RESERVED_INSIGHT_SLUGS.includes(slug)) {
      return { ok: false, message: 'That slug is reserved for a section page.', fieldErrors: { slug: 'Reserved — try another' } }
    }
    if (slug !== existing.slug && (await isSlugTaken(slug, insightId))) {
      return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use — try another' } }
    }

    let featuredImageUrl: string | null | undefined = undefined // undefined = leave unchanged
    const removeImage = formData.get('removeImage') === 'on'
    const imageFile = formData.get('featuredImage')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadInsightImage(imageFile, insightId)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { featuredImage: result.error } }
      await deleteInsightImageByUrl(existing.featured_image)
      featuredImageUrl = result.url
    } else if (removeImage) {
      await deleteInsightImageByUrl(existing.featured_image)
      featuredImageUrl = null
    }

    const { status, publish_at, expires_at } = resolveStatusAndDates(intent, parsed.data)

    const update: Record<string, unknown> = {
      title: parsed.data.title,
      slug,
      short_description: parsed.data.shortDescription || null,
      content: sanitizeInsightHtml(parsed.data.content),
      category: parsed.data.category,
      content_type: parsed.data.contentType,
      status,
      is_featured: parsed.data.isFeatured === 'on',
      publish_at,
      expires_at,
      seo_title: seo.seo_title,
      seo_description: seo.seo_description,
      seo_noindex: parsed.data.seoNoindex === 'on',
      event_start_at: parsed.data.eventStartAt ? new Date(parsed.data.eventStartAt).toISOString() : null,
      event_end_at: parsed.data.eventEndAt ? new Date(parsed.data.eventEndAt).toISOString() : null,
      event_venue: parsed.data.eventVenue || null,
      event_registration_url: parsed.data.eventRegistrationUrl || null,
      event_contact: parsed.data.eventContact || null
    }
    if (featuredImageUrl !== undefined) update.featured_image = featuredImageUrl

    const { error } = await admin.from('insights').update(update).eq('id', insightId)
    if (error) {
      console.error('[crm] failed to update insight', error)
      if (error.code === '23505') return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use' } }
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'insight.updated',
      entity: 'insight',
      entityId: insightId,
      metadata: { title: parsed.data.title, status }
    })

    // Renamed slug → keep the old URL alive with a permanent redirect.
    if (slug !== existing.slug) await recordSlugChange(admin, '/insights', existing.slug, slug)

    revalidateInsightPaths(slug, existing.slug)
    return { ok: true, id: insightId }
  } catch (err) {
    return authError(err)
  }
}

/** Shared handler for the simple status-transition actions below. */
async function transitionInsight(
  insightId: string,
  update: Record<string, unknown>,
  auditAction: string,
  action: 'publish' | 'unpublish' | 'edit'
): Promise<ActionResult> {
  try {
    if (!insightId) return { ok: false, message: 'Missing insight.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('insights').select('slug, content_type').eq('id', insightId).maybeSingle()
    if (!existing) return { ok: false, message: 'This insight no longer exists.' }

    const staff = await requireInsightPermission(existing.content_type, action)

    const { error } = await admin.from('insights').update(update).eq('id', insightId)
    if (error) return { ok: false, message: 'Could not update this insight.' }

    await logAudit(admin, { userId: staff.id, action: auditAction, entity: 'insight', entityId: insightId })

    revalidateInsightPaths(existing.slug)
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function publishInsightNow(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const insightId = String(formData.get('insightId') || '')
  return transitionInsight(insightId, { status: 'published', publish_at: new Date().toISOString() }, 'insight.published', 'publish')
}

export async function archiveInsight(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const insightId = String(formData.get('insightId') || '')
  return transitionInsight(insightId, { status: 'archived' }, 'insight.archived', 'unpublish')
}

export async function restoreInsightToDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const insightId = String(formData.get('insightId') || '')
  return transitionInsight(insightId, { status: 'draft' }, 'insight.restored', 'edit')
}

export async function toggleInsightFeatured(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const insightId = String(formData.get('insightId') || '')
  const nextValue = formData.get('nextValue') === 'true'
  return transitionInsight(
    insightId,
    { is_featured: nextValue },
    nextValue ? 'insight.featured' : 'insight.unfeatured',
    'edit'
  )
}

/**
 * Permanently removes an insight/event and its featured image. This is
 * distinct from archiveInsight (a reversible status change) — deletion
 * cannot be undone, so it's restricted to draft/archived items only.
 * Published or scheduled content must be archived first, which keeps the
 * public site from ever losing a live page out from under a visitor and
 * gives staff a chance to reconsider before the record is gone for good.
 */
export async function deleteInsight(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const insightId = String(formData.get('insightId') || '')
    if (!insightId) return { ok: false, message: 'Missing insight.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('insights')
      .select('id, title, slug, status, content_type, featured_image')
      .eq('id', insightId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This insight no longer exists.' }

    // Gate on the record's ACTUAL content type and the 'delete' action
    // specifically — a Content Manager who can only view/edit News must not
    // be able to delete an Event (or vice versa) by submitting its id.
    const staff = await requireInsightPermission(existing.content_type, 'delete')

    if (existing.status !== 'draft' && existing.status !== 'archived') {
      return { ok: false, message: 'Archive this insight before deleting it.' }
    }

    const { error } = await admin.from('insights').delete().eq('id', insightId)
    if (error) {
      console.error('[crm] failed to delete insight', error)
      return { ok: false, message: 'Could not delete this insight.' }
    }

    await deleteInsightImageByUrl(existing.featured_image)

    await logAudit(admin, {
      userId: staff.id,
      action: 'insight.deleted',
      entity: 'insight',
      entityId: insightId,
      metadata: { title: existing.title, slug: existing.slug }
    })

    revalidateInsightPaths(existing.slug)
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
