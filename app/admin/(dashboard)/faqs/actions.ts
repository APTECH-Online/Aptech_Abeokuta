'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireFaqsAccess, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { getNextFaqSortOrder } from '../../../../lib/crm/faqs'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected faqs error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateFaqPaths() {
  revalidatePath('/admin/faqs')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/admissions')
}

function validateFields(raw: { question: string; answer: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.question.trim()) fieldErrors.question = 'Question is required.'
  else if (raw.question.length > 300) fieldErrors.question = 'Keep the question under 300 characters.'
  if (!raw.answer.trim()) fieldErrors.answer = 'Answer is required.'
  else if (raw.answer.length > 2000) fieldErrors.answer = 'Keep the answer under 2000 characters.'
  return fieldErrors
}

export async function createFaq(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireFaqsAccess()

    const question = String(formData.get('question') || '').trim()
    const answer = String(formData.get('answer') || '').trim()

    const fieldErrors = validateFields({ question, answer })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const id = randomUUID()
    const admin = createAdminClient()
    const sortOrder = await getNextFaqSortOrder()
    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin.from('faqs').insert({
      id,
      question,
      answer,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create faq', error)
      return { ok: false, message: 'Could not save this FAQ.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'faq.created',
      entity: 'faq',
      entityId: id,
      metadata: { question, isPublished }
    })

    revalidateFaqPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateFaq(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireFaqsAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing FAQ.' }

    const question = String(formData.get('question') || '').trim()
    const answer = String(formData.get('answer') || '').trim()
    const sortOrderRaw = String(formData.get('sortOrder') || '0')
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

    const fieldErrors = validateFields({ question, answer })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('faqs').select('id').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This FAQ no longer exists.' }

    const isPublished = formData.get('isPublished') !== 'off'

    const { error } = await admin
      .from('faqs')
      .update({ question, answer, sort_order: sortOrder, is_published: isPublished })
      .eq('id', itemId)

    if (error) {
      console.error('[crm] failed to update faq', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'faq.updated',
      entity: 'faq',
      entityId: itemId,
      metadata: { question, isPublished }
    })

    revalidateFaqPaths()
    return { ok: true, id: itemId }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleFaqPublished(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireFaqsAccess()
    const itemId = String(formData.get('itemId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!itemId) return { ok: false, message: 'Missing FAQ.' }

    const admin = createAdminClient()
    const { error } = await admin.from('faqs').update({ is_published: nextValue }).eq('id', itemId)
    if (error) return { ok: false, message: 'Could not update this FAQ.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'faq.published' : 'faq.unpublished',
      entity: 'faq',
      entityId: itemId
    })

    revalidateFaqPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function deleteFaq(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireFaqsAccess()
    const itemId = String(formData.get('itemId') || '')
    if (!itemId) return { ok: false, message: 'Missing FAQ.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('faqs').select('id, question').eq('id', itemId).maybeSingle()
    if (!existing) return { ok: false, message: 'This FAQ no longer exists.' }

    const { error } = await admin.from('faqs').delete().eq('id', itemId)
    if (error) {
      console.error('[crm] failed to delete faq', error)
      return { ok: false, message: 'Could not delete this FAQ.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'faq.deleted',
      entity: 'faq',
      entityId: itemId,
      metadata: { question: existing.question }
    })

    revalidateFaqPaths()
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
