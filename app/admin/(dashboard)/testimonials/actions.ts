'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireTestimonialsAccess, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { uploadTestimonialImage, deleteTestimonialImageByUrl } from '../../../../lib/supabase/testimonial-storage'
import { getNextTestimonialSortOrder } from '../../../../lib/crm/testimonials'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected testimonials error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateTestimonialPaths() {
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')
  revalidatePath('/testimonials')
  revalidatePath('/')
}

function validateFields(raw: { name: string; program: string; quote: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.name.trim()) fieldErrors.name = 'Name is required.'
  else if (raw.name.length > 120) fieldErrors.name = 'Keep the name under 120 characters.'
  if (!raw.program.trim()) fieldErrors.program = 'Programme is required.'
  if (!raw.quote.trim()) fieldErrors.quote = 'Quote is required.'
  else if (raw.quote.length > 2000) fieldErrors.quote = 'Keep the quote under 2000 characters.'
  return fieldErrors
}

export async function createTestimonial(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireTestimonialsAccess()

    const name = String(formData.get('name') || '').trim()
    const program = String(formData.get('program') || '').trim()
    const quote = String(formData.get('quote') || '').trim()
    const consentConfirmed = formData.get('consentConfirmed') === 'on'
    const storyType = String(formData.get('storyType') || 'testimonial')
    const projectTitle = String(formData.get('projectTitle') || '').trim() || null
    const storySummary = String(formData.get('storySummary') || '').trim() || null
    const programmeSlug = String(formData.get('programmeSlug') || '').trim() || null
    const validStoryTypes = ['testimonial','student_project','graduate_experience','employer_outcome','certification_outcome']
    if (!validStoryTypes.includes(storyType)) return { ok: false, message: 'Choose a valid story type.' }
    const isPublished = formData.get('isPublished') !== 'off'
    if (isPublished && !consentConfirmed) return { ok: false, message: 'Confirm authenticity and publication permission before publishing.' }

    const fieldErrors = validateFields({ name, program, quote })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()

    let imageUrl: string | null = null
    const imageFile = formData.get('image')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadTestimonialImage(imageFile, id)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { image: result.error } }
      imageUrl = result.url
    }

    const sortOrder = await getNextTestimonialSortOrder()
    const { error } = await admin.from('testimonials').insert({
      id,
      name,
      program,
      quote,
      story_type: storyType, project_title: projectTitle, story_summary: storySummary, programme_slug: programmeSlug,
      consent_confirmed: consentConfirmed, consent_confirmed_at: consentConfirmed ? new Date().toISOString() : null,
      verified_by: isPublished ? staff.id : null, verified_at: isPublished ? new Date().toISOString() : null,
      image_url: imageUrl,
      sort_order: sortOrder,
      is_published: isPublished && consentConfirmed,
      uploaded_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create testimonial', error)
      if (imageUrl) await deleteTestimonialImageByUrl(imageUrl)
      return { ok: false, message: 'Could not save this testimonial.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'testimonial.created',
      entity: 'testimonial',
      entityId: id,
      metadata: { name, program, isPublished }
    })

    revalidateTestimonialPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateTestimonial(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireTestimonialsAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing testimonial.' }

    const name = String(formData.get('name') || '').trim()
    const program = String(formData.get('program') || '').trim()
    const quote = String(formData.get('quote') || '').trim()
    const consentConfirmed = formData.get('consentConfirmed') === 'on'
    const storyType = String(formData.get('storyType') || 'testimonial')
    const projectTitle = String(formData.get('projectTitle') || '').trim() || null
    const storySummary = String(formData.get('storySummary') || '').trim() || null
    const programmeSlug = String(formData.get('programmeSlug') || '').trim() || null
    const validStoryTypes = ['testimonial','student_project','graduate_experience','employer_outcome','certification_outcome']
    if (!validStoryTypes.includes(storyType)) return { ok: false, message: 'Choose a valid story type.' }
    const isPublished = formData.get('isPublished') !== 'off'
    if (isPublished && !consentConfirmed) return { ok: false, message: 'Confirm authenticity and publication permission before publishing.' }
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ name, program, quote })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('testimonials')
      .select('id, image_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This testimonial no longer exists.' }

    const removeImage = formData.get('removeImage') === 'on'
    let imageUrl: string | null | undefined = undefined // undefined = leave unchanged
    const imageFile = formData.get('image')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadTestimonialImage(imageFile, itemId)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { image: result.error } }
      await deleteTestimonialImageByUrl(existing.image_url)
      imageUrl = result.url
    } else if (removeImage) {
      await deleteTestimonialImageByUrl(existing.image_url)
      imageUrl = null
    }

    const { error } = await admin
      .from('testimonials')
      .update({
        name,
        program,
        quote, story_type: storyType, project_title: projectTitle, story_summary: storySummary, programme_slug: programmeSlug,
        consent_confirmed: consentConfirmed, consent_confirmed_at: consentConfirmed ? new Date().toISOString() : null,
        verified_by: isPublished ? staff.id : null, verified_at: isPublished ? new Date().toISOString() : null,
        sort_order: sortOrder,
        is_published: isPublished && consentConfirmed,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {})
      })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update testimonial', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'testimonial.updated',
      entity: 'testimonial',
      entityId: itemId,
      metadata: { name, program, isPublished }
    })

    revalidateTestimonialPaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleTestimonialPublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireTestimonialsAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing testimonial.' }

    const admin = createAdminClient()
    if (nextValue) {
      const { data: existing, error: lookupError } = await admin.from('testimonials')
        .select('consent_confirmed')
        .eq('id', itemId)
        .maybeSingle()
      if (lookupError || !existing) return { ok: false, message: 'Could not verify this story.' }
      if (!existing.consent_confirmed) return { ok: false, message: 'Verify authenticity and publication permission in the story editor before publishing.' }
    }
    const { error } = await admin.from('testimonials').update({
      is_published: nextValue,
      ...(nextValue ? { verified_by: staff.id, verified_at: new Date().toISOString() } : {})
    }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this testimonial.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'testimonial.published' : 'testimonial.unpublished',
      entity: 'testimonial',
      entityId: itemId
    })

    revalidateTestimonialPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function deleteTestimonial(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireTestimonialsAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing testimonial.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('testimonials')
      .select('id, name, image_url')
      .eq('id', itemId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This testimonial no longer exists.' }

    const { error } = await admin.from('testimonials').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete testimonial', error)
      return { ok: false, message: 'Could not delete this testimonial.' }
    }

    await deleteTestimonialImageByUrl(existing.image_url)

    await logAudit(admin, {
      userId: staff.id,
      action: 'testimonial.deleted',
      entity: 'testimonial',
      entityId: itemId,
      metadata: { name: existing.name }
    })

    revalidateTestimonialPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
