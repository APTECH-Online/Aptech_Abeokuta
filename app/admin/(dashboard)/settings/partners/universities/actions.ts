'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../../lib/supabase/admin'
import { requirePartnersAccess, ForbiddenError, UnauthorizedError } from '../../../../../../lib/auth'
import { logAudit } from '../../../../../../lib/audit'
import { uploadPartnerLogo, deletePartnerLogoByUrl } from '../../../../../../lib/supabase/partner-logo-storage'
import { getNextUniversitySortOrder } from '../../../../../../lib/crm/partners'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected affiliated university error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidatePaths() {
  revalidatePath('/admin/settings/partners/universities')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/about')
}

function validateWebsiteUrl(raw: string): string | null {
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return 'Link must start with https:// or http://.'
    }
  } catch {
    return 'Enter a full link, e.g. https://bangor.ac.uk.'
  }
  return null
}

function validateFields(raw: { name: string; websiteUrl: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.name) fieldErrors.name = 'Name is required.'
  else if (raw.name.length > 150) fieldErrors.name = 'Keep the name under 150 characters.'
  const websiteError = validateWebsiteUrl(raw.websiteUrl)
  if (websiteError) fieldErrors.websiteUrl = websiteError
  return fieldErrors
}

export async function createAffiliatedUniversity(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()

    const name = String(formData.get('name') || '').trim()
    const websiteUrl = String(formData.get('websiteUrl') || '').trim()

    const fieldErrors = validateFields({ name, websiteUrl })
    const logoFile = formData.get('logo')
    if (!(logoFile instanceof File) || logoFile.size === 0) {
      fieldErrors.logo = 'Choose a logo to upload.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()

    const result = await uploadPartnerLogo(logoFile as File, id)
    if ('error' in result) return { ok: false, message: result.error, fieldErrors: { logo: result.error } }

    const sortOrder = await getNextUniversitySortOrder()
    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin.from('affiliated_universities').insert({
      id,
      name,
      logo_url: result.url,
      website_url: websiteUrl || null,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create affiliated university', error)
      await deletePartnerLogoByUrl(result.url)
      return { ok: false, message: 'Could not save this university.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'affiliated_university.created',
      entity: 'affiliated_university',
      entityId: id,
      metadata: { name, isPublished }
    })

    revalidatePaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateAffiliatedUniversity(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing university.' }

    const name = String(formData.get('name') || '').trim()
    const websiteUrl = String(formData.get('websiteUrl') || '').trim()
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ name, websiteUrl })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('affiliated_universities')
      .select('id, logo_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This university no longer exists.' }

    let logoUrl: string | undefined = undefined // undefined = leave unchanged
    const logoFile = formData.get('logo')
    if (logoFile instanceof File && logoFile.size > 0) {
      const result = await uploadPartnerLogo(logoFile, itemId)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { logo: result.error } }
      await deletePartnerLogoByUrl(existing.logo_url)
      logoUrl = result.url
    }

    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin
      .from('affiliated_universities')
      .update({
        name,
        website_url: websiteUrl || null,
        sort_order: sortOrder,
        is_published: isPublished,
        ...(logoUrl !== undefined ? { logo_url: logoUrl } : {})
      })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update affiliated university', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'affiliated_university.updated',
      entity: 'affiliated_university',
      entityId: itemId,
      metadata: { name, isPublished }
    })

    revalidatePaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleAffiliatedUniversityPublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing university.' }

    const admin = createAdminClient()
    const { error } = await admin.from('affiliated_universities').update({ is_published: nextValue }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this university.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'affiliated_university.published' : 'affiliated_university.unpublished',
      entity: 'affiliated_university',
      entityId: itemId
    })

    revalidatePaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function deleteAffiliatedUniversity(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing university.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('affiliated_universities')
      .select('id, name, logo_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This university no longer exists.' }

    const { error } = await admin.from('affiliated_universities').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete affiliated university', error)
      return { ok: false, message: 'Could not delete this university.' }
    }

    await deletePartnerLogoByUrl(existing.logo_url)

    await logAudit(admin, {
      userId: staff.id,
      action: 'affiliated_university.deleted',
      entity: 'affiliated_university',
      entityId: itemId,
      metadata: { name: existing.name }
    })

    revalidatePaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
