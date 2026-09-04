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

  // Honeypot check FIRST — before schema validation. If we validated the
  // honeypot as part of the schema, a browser autofilling this hidden field
  // (autofill sometimes targets it because the name contains "website")
  // would fail the whole form with no visible highlighted field, since the
  // honeypot input isn't rendered. Checking it separately, up front, means a
  // real visitor's legitimate name/email/message are never blocked by it.
  if (typeof raw.companyWebsite === 'string' && raw.companyWebsite.length > 0) {
    // Honeypot tripped — silently pretend success so bots don't learn.
    return { status: 'success' }
  }

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
    // --- Duplicate detection ----------------------------------------------------
    const existingLead = await findExistingLead(admin, { email: values.email, phone, whatsapp: null })

    let leadId: string
    let isDuplicate = false

    if (existingLead) {
      isDuplicate = true
      leadId = existingLead.id
    } else {
      const leadReference = await generateLeadReference(admin)

      const { data: created, error: createError } = await admin
        .from('leads')
        .insert({
          lead_reference: leadReference,
          first_name: firstName,
          last_name: lastName,
          email: values.email,
          phone: phone || 'Not provided',
          status: 'new',
          source: 'website',
          landing_page: '/contact'
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error('[contact] failed to create lead', createError)
        return {
          status: 'error',
          message: "We couldn't send your message right now. Please try again shortly."
        }
      }

      leadId = created.id
    }

    // --- Interaction history ------------------------------------------------
    await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: null,
      type: 'website',
      subject: values.subject || 'Website contact form',
      description: values.message
    })

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
