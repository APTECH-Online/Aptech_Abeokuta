'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireGalleryAccess, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { uploadGalleryImage, deleteGalleryImageByUrl } from '../../../../lib/supabase/gallery-storage'
import { getNextSortOrder } from '../../../../lib/crm/gallery'
import type { GalleryDisplaySize } from '../../../../types/db'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected gallery error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateGalleryPaths() {
  revalidatePath('/admin/gallery')
  revalidatePath('/admin')
  revalidatePath('/gallery')
}

const DISPLAY_SIZES: GalleryDisplaySize[] = ['feature', 'tall', 'standard']

function validateFields(raw: { title: string; category: string; altText: string; displaySize: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.title || raw.title.trim().length === 0) fieldErrors.title = 'Title is required.'
  else if (raw.title.length > 200) fieldErrors.title = 'Keep the title under 200 characters.'
  if (!raw.category || raw.category.trim().length === 0) fieldErrors.category = 'Choose or enter a category.'
  if (!raw.altText || raw.altText.trim().length === 0) fieldErrors.altText = 'Alt text is required for accessibility.'
  else if (raw.altText.length > 300) fieldErrors.altText = 'Keep alt text under 300 characters.'
  if (!DISPLAY_SIZES.includes(raw.displaySize as GalleryDisplaySize)) fieldErrors.displaySize = 'Choose a valid layout size.'
  return fieldErrors
}

export async function createGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireGalleryAccess()

    const title = String(formData.get('title') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const altText = String(formData.get('altText') || '').trim()
    const displaySize = String(formData.get('displaySize') || 'standard')

    const fieldErrors = validateFields({ title, category, altText, displaySize })
    const imageFile = formData.get('image')
    if (!(imageFile instanceof File) || imageFile.size === 0) {
      fieldErrors.image = 'Choose a photo to upload.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()

    const result = await uploadGalleryImage(imageFile as File, id)
    if ('error' in result) return { ok: false, message: result.error, fieldErrors: { image: result.error } }

    const sortOrder = await getNextSortOrder()
    const isPublished = formData.get('isPublished') !== 'off' // default checked

    const { error } = await admin.from('gallery_items').insert({
      id,
      title,
      category,
      alt_text: altText,
      image_url: result.url,
      display_size: displaySize,
      sort_order: sortOrder,
      is_published: isPublished,
      uploaded_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create gallery item', error)
      await deleteGalleryImageByUrl(result.url)
      return { ok: false, message: 'Could not save this photo.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'gallery.created',
      entity: 'gallery_item',
      entityId: id,
      metadata: { title, category, isPublished }
    })

    revalidateGalleryPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireGalleryAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing gallery item.' }

    const title = String(formData.get('title') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const altText = String(formData.get('altText') || '').trim()
    const displaySize = String(formData.get('displaySize') || 'standard')
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ title, category, altText, displaySize })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('gallery_items')
      .select('id, image_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This photo no longer exists.' }

    let imageUrl: string | undefined = undefined // undefined = leave unchanged
    const imageFile = formData.get('image')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadGalleryImage(imageFile, itemId)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { image: result.error } }
      await deleteGalleryImageByUrl(existing.image_url)
      imageUrl = result.url
    }

    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin
      .from('gallery_items')
      .update({
        title,
        category,
        alt_text: altText,
        display_size: displaySize,
        sort_order: sortOrder,
        is_published: isPublished,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {})
      })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update gallery item', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'gallery.updated',
      entity: 'gallery_item',
      entityId: itemId,
      metadata: { title, category, isPublished }
    })

    revalidateGalleryPaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function togglePublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireGalleryAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing gallery item.' }

    const admin = createAdminClient()
    const { error } = await admin.from('gallery_items').update({ is_published: nextValue }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this photo.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'gallery.published' : 'gallery.unpublished',
      entity: 'gallery_item',
      entityId: itemId
    })

    revalidateGalleryPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

/** Permanently removes a photo and its stored file. Unlike Insights, there's
 * no draft/archived gate here — a gallery photo has no public URL of its
 * own to break (it's just a tile in a grid), so delete is safe outright. */
export async function deleteGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireGalleryAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing gallery item.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('gallery_items')
      .select('id, title, image_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This photo no longer exists.' }

    const { error } = await admin.from('gallery_items').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete gallery item', error)
      return { ok: false, message: 'Could not delete this photo.' }
    }

    await deleteGalleryImageByUrl(existing.image_url)

    await logAudit(admin, {
      userId: staff.id,
      action: 'gallery.deleted',
      entity: 'gallery_item',
      entityId: itemId,
      metadata: { title: existing.title }
    })

    revalidateGalleryPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
