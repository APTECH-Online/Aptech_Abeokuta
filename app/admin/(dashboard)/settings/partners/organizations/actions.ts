'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../../lib/supabase/admin'
import { requirePartnersAccess, ForbiddenError, UnauthorizedError } from '../../../../../../lib/auth'
import { logAudit } from '../../../../../../lib/audit'
import { getNextPartnerOrgSortOrder } from '../../../../../../lib/crm/partners'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected partner organization error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidatePaths() {
  revalidatePath('/admin/settings/partners/organizations')
  revalidatePath('/admin')
  revalidatePath('/about')
}

/** One bullet per line; blank lines dropped, each trimmed, capped at 10. */
function parsePoints(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
}

function validateFields(raw: { title: string; body: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.title) fieldErrors.title = 'Title is required.'
  else if (raw.title.length > 200) fieldErrors.title = 'Keep the title under 200 characters.'
  if (!raw.body) fieldErrors.body = 'Description is required.'
  else if (raw.body.length > 1000) fieldErrors.body = 'Keep the description under 1000 characters.'
  return fieldErrors
}

export async function createPartnerOrganization(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()

    const title = String(formData.get('title') || '').trim()
    const body = String(formData.get('body') || '').trim()
    const points = parsePoints(String(formData.get('points') || ''))

    const fieldErrors = validateFields({ title, body })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()
    const sortOrder = await getNextPartnerOrgSortOrder()
    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin.from('partner_organizations').insert({
      id,
      title,
      body,
      points,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create partner organization', error)
      return { ok: false, message: 'Could not save this partner.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'partner_organization.created',
      entity: 'partner_organization',
      entityId: id,
      metadata: { title, isPublished }
    })

    revalidatePaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updatePartnerOrganization(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing partner.' }

    const title = String(formData.get('title') || '').trim()
    const body = String(formData.get('body') || '').trim()
    const points = parsePoints(String(formData.get('points') || ''))
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ title, body })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('partner_organizations').select('id').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This partner no longer exists.' }

    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin
      .from('partner_organizations')
      .update({ title, body, points, sort_order: sortOrder, is_published: isPublished })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update partner organization', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'partner_organization.updated',
      entity: 'partner_organization',
      entityId: itemId,
      metadata: { title, isPublished }
    })

    revalidatePaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function togglePartnerOrganizationPublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing partner.' }

    const admin = createAdminClient()
    const { error } = await admin.from('partner_organizations').update({ is_published: nextValue }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this partner.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'partner_organization.published' : 'partner_organization.unpublished',
      entity: 'partner_organization',
      entityId: itemId
    })

    revalidatePaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function deletePartnerOrganization(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing partner.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('partner_organizations').select('id, title').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This partner no longer exists.' }

    const { error } = await admin.from('partner_organizations').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete partner organization', error)
      return { ok: false, message: 'Could not delete this partner.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'partner_organization.deleted',
      entity: 'partner_organization',
      entityId: itemId,
      metadata: { title: existing.title }
    })

    revalidatePaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
