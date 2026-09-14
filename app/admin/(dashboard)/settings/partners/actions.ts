'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requirePartnersAccess, ForbiddenError, UnauthorizedError } from '../../../../../lib/auth'
import { logAudit } from '../../../../../lib/audit'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected partners highlight error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidatePartnersPaths() {
  revalidatePath('/admin/settings/partners')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/about')
}

/**
 * Upserts the single partners_highlight row. There's no "new" flow for this
 * one — the form always edits whichever row exists, and creates the first
 * one on save if the table is still empty.
 */
export async function updatePartnersHighlight(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requirePartnersAccess()

    const existingId = String(formData.get('highlightId') || '')
    const headline = String(formData.get('headline') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const ctaLabel = String(formData.get('ctaLabel') || '').trim()
    const ctaHref = String(formData.get('ctaHref') || '').trim()
    const isPublished = formData.get('isPublished') !== 'off'

    const fieldErrors: Record<string, string> = {}
    if (!headline) fieldErrors.headline = 'Headline is required.'
    else if (headline.length > 300) fieldErrors.headline = 'Keep the headline under 300 characters.'
    if (!description) fieldErrors.description = 'Description is required.'
    else if (description.length > 500) fieldErrors.description = 'Keep the description under 500 characters.'
    if (!ctaLabel) fieldErrors.ctaLabel = 'Button label is required.'
    if (!ctaHref) fieldErrors.ctaHref = 'Button link is required.'
    else if (!ctaHref.startsWith('/') && !ctaHref.startsWith('http')) {
      fieldErrors.ctaHref = 'Use a path starting with / (e.g. /about#partners) or a full https:// link.'
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const id = existingId || randomUUID()

    const { error } = await admin.from('partners_highlight').upsert({
      id,
      headline,
      description,
      cta_label: ctaLabel,
      cta_href: ctaHref,
      is_published: isPublished,
      updated_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to save partners highlight', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'partners_highlight.updated',
      entity: 'partners_highlight',
      entityId: id
    })

    revalidatePartnersPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}
