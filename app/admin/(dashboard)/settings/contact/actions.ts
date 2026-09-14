'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireContactInfoAccess, ForbiddenError, UnauthorizedError } from '../../../../../lib/auth'
import { logAudit } from '../../../../../lib/audit'
import type { ContactHour } from '../../../../../types/db'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected contact info error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateContactPaths() {
  revalidatePath('/admin/settings/contact')
  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  revalidatePath('/contact')
}

/**
 * Each line is "Day | Time", e.g. "Monday – Friday | 9:00 AM – 5:00 PM".
 * A pipe rather than a colon delimiter because times themselves contain
 * colons ("9:00 AM"), which would break a colon-based split. Blank lines
 * and lines missing either side are dropped; capped at 7 (one per day of
 * the week, generously).
 */
function parseHours(raw: string): ContactHour[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [day, ...rest] = line.split('|')
      return { day: (day ?? '').trim(), time: rest.join('|').trim() }
    })
    .filter((h) => h.day && h.time)
    .slice(0, 7)
}

function validateFields(raw: { phone: string; whatsapp: string; email: string; address: string }) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.phone) fieldErrors.phone = 'Phone number is required.'
  else if (raw.phone.length > 40) fieldErrors.phone = 'Keep the phone number under 40 characters.'
  if (!raw.whatsapp) fieldErrors.whatsapp = 'WhatsApp number is required.'
  else if (raw.whatsapp.length > 40) fieldErrors.whatsapp = 'Keep the WhatsApp number under 40 characters.'
  if (!raw.email) fieldErrors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) fieldErrors.email = 'Enter a valid email address.'
  else if (raw.email.length > 200) fieldErrors.email = 'Keep the email under 200 characters.'
  if (!raw.address) fieldErrors.address = 'Address is required.'
  else if (raw.address.length > 500) fieldErrors.address = 'Keep the address under 500 characters.'
  return fieldErrors
}

/**
 * Upserts the single contact_info row. There's no "new" flow — the form
 * always edits whichever row exists, and creates the first one on save if
 * the table is still empty. Same pattern as updatePartnersHighlight in
 * app/admin/(dashboard)/settings/partners/actions.ts.
 */
export async function updateContactInfo(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireContactInfoAccess()

    const existingId = String(formData.get('contactId') || '')
    const phone = String(formData.get('phone') || '').trim()
    const whatsapp = String(formData.get('whatsapp') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const address = String(formData.get('address') || '').trim()
    const hours = parseHours(String(formData.get('hours') || ''))

    const fieldErrors = validateFields({ phone, whatsapp, email, address })
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const id = existingId || randomUUID()

    const { error } = await admin.from('contact_info').upsert({
      id,
      phone,
      whatsapp,
      email,
      address,
      hours,
      updated_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to save contact info', error)
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'contact_info.updated',
      entity: 'contact_info',
      entityId: id
    })

    revalidateContactPaths()
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}
