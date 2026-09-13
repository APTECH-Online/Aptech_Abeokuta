'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireSocialLinksAccess, ForbiddenError, UnauthorizedError } from '../../../../../lib/auth'
import { logAudit } from '../../../../../lib/audit'
import { getNextSocialLinkSortOrder, SOCIAL_PLATFORMS } from '../../../../../lib/crm/social-links'
import type { SocialPlatform } from '../../../../../types/db'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

const VALID_PLATFORMS = new Set(SOCIAL_PLATFORMS.map((p) => p.value))

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected social link error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateSocialLinkPaths() {
  revalidatePath('/admin/settings/social')
  revalidatePath('/admin')
  // The footer with these links is rendered on every public page via the
  // shared (site) layout, so the whole group needs revalidating.
  revalidatePath('/', 'layout')
}

function validateFields(raw: { platform: string; label: string; url: string }) {
  const fieldErrors: Record<string, string> = {}

  if (!VALID_PLATFORMS.has(raw.platform as SocialPlatform)) {
    fieldErrors.platform = 'Choose a valid platform.'
  }
  if (raw.platform === 'other' && !raw.label.trim()) {
    fieldErrors.label = 'A label is required for "Other" links, since there is no default icon text for them.'
  }
  if (raw.label.length > 100) {
    fieldErrors.label = 'Keep the label under 100 characters.'
  }
  if (!raw.url.trim()) {
    fieldErrors.url = 'Link is required.'
  } else {
    try {
      const parsed = new URL(raw.url.trim())
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        fieldErrors.url = 'Link must start with https:// or http://.'
      }
    } catch {
      fieldErrors.url = 'Enter a full link, e.g. https://facebook.com/yourpage.'
    }
    if (raw.url.length > 500) fieldErrors.url = 'Keep the link under 500 characters.'
  }

  return fieldErrors
}

export async function createSocialLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireSocialLinksAccess()

    const platform = String(formData.get('platform') || '')
    const label = String(formData.get('label') || '').trim()
    const url = String(formData.get('url') || '').trim()

    const fieldErrors = validateFields({ platform, label, url })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()
    const sortOrder = await getNextSocialLinkSortOrder()
    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin.from('social_links').insert({
      id,
      platform,
      label: label || null,
      url,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create social link', error)
      return { ok: false, message: 'Could not save this link.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'social_link.created',
      entity: 'social_link',
      entityId: id,
      metadata: { platform, url, isPublished }
    })

    revalidateSocialLinkPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateSocialLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireSocialLinksAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing link.' }

    const platform = String(formData.get('platform') || '')
    const label = String(formData.get('label') || '').trim()
    const url = String(formData.get('url') || '').trim()
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ platform, label, url })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('social_links').select('id').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This link no longer exists.' }

    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin
      .from('social_links')
      .update({ platform, label: label || null, url, sort_order: sortOrder, is_published: isPublished })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update social link', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'social_link.updated',
      entity: 'social_link',
      entityId: itemId,
      metadata: { platform, url, isPublished }
    })

    revalidateSocialLinkPaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleSocialLinkPublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireSocialLinksAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing link.' }

    const admin = createAdminClient()
    const { error } = await admin.from('social_links').update({ is_published: nextValue }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this link.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'social_link.published' : 'social_link.unpublished',
      entity: 'social_link',
      entityId: itemId
    })

    revalidateSocialLinkPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function deleteSocialLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireSocialLinksAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing link.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('social_links').select('id, platform').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This link no longer exists.' }

    const { error } = await admin.from('social_links').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete social link', error)
      return { ok: false, message: 'Could not delete this link.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'social_link.deleted',
      entity: 'social_link',
      entityId: itemId,
      metadata: { platform: existing.platform }
    })

    revalidateSocialLinkPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
