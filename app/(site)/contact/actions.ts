'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '../../../lib/supabase/admin'
import { contactFormSchema, formatZodErrors } from '../../../lib/validation'
import { findExistingLead } from '../../../lib/duplicate'
import { generateLeadReference } from '../../../lib/reference'
import { checkRateLimit } from '../../../lib/rate-limit'
import { logAudit } from '../../../lib/audit'
import { sendEmail } from '../../../lib/email/send'
import { contactAcknowledgementEmail, adminNewContactMessageEmail } from '../../../lib/email/templates'

export type SubmitContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
}

const CONTACT_NOTIFICATION_EMAIL = process.env.ADMISSIONS_NOTIFICATION_EMAIL || 'aptech.abeokuta@gmail.com'

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '—' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function submitContactMessage(
  _prevState: SubmitContactState,
  formData: FormData
): Promise<SubmitContactState> {
  // --- Rate limiting ---------------------------------------------------------
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  const rateLimit = checkRateLimit(`contact-form:${ip}`)
  if (!rateLimit.allowed) {
    return {
      status: 'error',
      message: "You've submitted a few messages in a short time. Please wait a minute and try again."
    }
  }

  // --- Parse + validate --------------------------------------------------------
  const raw = Object.fromEntries(formData.entries())


  const parsed = contactFormSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors: formatZodErrors(parsed.error)
    }
  }

  const values = parsed.data
  const { firstName, lastName } = splitName(values.name)
  const phone = values.phone?.trim() || ''

  let admin: ReturnType<typeof createAdminClient>

  try {
    admin = createAdminClient()
  } catch (err) {
    // Supabase isn't configured/reachable — fail with a friendly message
    // instead of an uncaught 500.
    console.error('[contact] Supabase unavailable while submitting message', err)
    return {
      status: 'error',
      message: "We couldn't send your message right now. Please try again shortly, or email us directly."
    }
  }

  try {
    // The contact form is written through a database RPC so lead creation and
    // the website interaction are handled atomically in Supabase.
    const { data: submission, error: submissionError } = await admin.rpc('submit_contact_form', {
      p_name: values.name,
      p_email: values.email,
      p_phone: phone || null,
      p_subject: values.subject || null,
      p_message: values.message,
      p_landing_page: '/contact'
    }).maybeSingle()

    if (submissionError || !submission) {
      console.error('[contact] submit_contact_form RPC failed', submissionError)
      return {
        status: 'error',
        message: "We couldn't save your message to the admissions CRM right now. Please try again shortly."
      }
    }

    const leadId = submission.lead_id as string
    const isDuplicate = Boolean(submission.is_duplicate)

    await logAudit(admin, {
      action: isDuplicate ? 'lead.contacted' : 'lead.created',
      entity: 'lead',
      entityId: leadId,
      metadata: { source: 'website', channel: 'contact_form' }
    })

    // --- Notifications (best-effort; never block the success response) --------
    await Promise.allSettled([
      sendEmail({
        to: values.email,
        ...contactAcknowledgementEmail({ firstName })
      }),
      sendEmail({
        to: CONTACT_NOTIFICATION_EMAIL,
        ...adminNewContactMessageEmail({
          fullName: values.name,
          email: values.email,
          phone,
          subject: values.subject || '',
          message: values.message,
          isDuplicate
        })
      })
    ])

    return { status: 'success' }
  } catch (err) {
    console.error('[contact] unexpected error submitting message', err)
    return {
      status: 'error',
      message: 'Something went wrong on our end. Please try again, or contact us directly.'
    }
  }
}
