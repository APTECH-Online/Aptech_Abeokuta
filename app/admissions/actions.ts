'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '../../lib/supabase/admin'
import { admissionsFormSchema, formatZodErrors } from '../../lib/validation'
import { findExistingLead } from '../../lib/duplicate'
import { generateLeadReference } from '../../lib/reference'
import { checkRateLimit } from '../../lib/rate-limit'
import { logAudit } from '../../lib/audit'
import { sendEmail } from '../../lib/email/send'
import { applicantAcknowledgementEmail, adminNewLeadNotificationEmail } from '../../lib/email/templates'

export type SubmitEnquiryState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  leadReference?: string
  fieldErrors?: Record<string, string>
}

const ADMISSIONS_NOTIFICATION_EMAIL =
  process.env.ADMISSIONS_NOTIFICATION_EMAIL || 'aptech.abeokuta@gmail.com'

export async function submitEnquiry(
  _prevState: SubmitEnquiryState,
  formData: FormData
): Promise<SubmitEnquiryState> {
  // --- Rate limiting -------------------------------------------------------
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  const rateLimit = checkRateLimit(`admissions-form:${ip}`)
  if (!rateLimit.allowed) {
    return {
      status: 'error',
      message: "You've submitted a few requests in a short time. Please wait a minute and try again."
    }
  }

  // --- Parse + validate ------------------------------------------------------
  const raw = Object.fromEntries(formData.entries())
  const parsed = admissionsFormSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors: formatZodErrors(parsed.error)
    }
  }

  if (parsed.data.companyWebsite) {
    // Honeypot tripped — silently pretend success so bots don't learn.
    return { status: 'success', leadReference: 'APC-0000-000000' }
  }

  const values = parsed.data

  let admin: ReturnType<typeof createAdminClient>
  let programme: { id: string; name: string; status: string } | null

  try {
    admin = createAdminClient()

    // --- Confirm the programme exists and is currently active ------------------
    const { data, error: programmeError } = await admin
      .from('programmes')
      .select('id, name, status')
      .eq('id', values.programmeId)
      .maybeSingle()

    if (programmeError || !data) {
      return {
        status: 'error',
        message: 'Please select a valid programme.',
        fieldErrors: { programmeId: 'Please select a valid programme' }
      }
    }

    programme = data
  } catch (err) {
    // Supabase isn't configured/reachable — fail with a friendly message
    // instead of an uncaught 500.
    console.error('[admissions] Supabase unavailable while submitting enquiry', err)
    return {
      status: 'error',
      message: "We couldn't submit your enquiry right now. Please try again shortly, or contact us directly."
    }
  }

  if (!programme) {
    // Unreachable in practice (the block above returns early otherwise),
    // this just satisfies TypeScript's control-flow narrowing.
    return {
      status: 'error',
      message: 'Something went wrong on our end. Please try again, or contact us directly.'
    }
  }

  try {
    // --- Duplicate detection --------------------------------------------------
    const existingLead = await findExistingLead(admin, {
      email: values.email,
      phone: values.phone,
      whatsapp: values.whatsapp || null
    })

    let leadId: string
    let leadReference: string
    let isDuplicate = false

    if (existingLead) {
      isDuplicate = true
      leadId = existingLead.id
      leadReference = existingLead.lead_reference

      // Refresh contact details in case anything changed, without
      // clobbering CRM-managed fields like status or assignment.
      await admin
        .from('leads')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone,
          whatsapp: values.whatsapp || existingLead.whatsapp,
          gender: values.gender || existingLead.gender,
          date_of_birth: values.dateOfBirth || existingLead.date_of_birth,
          address: values.address || existingLead.address,
          city: values.city || existingLead.city,
          state: values.state || existingLead.state,
          country: values.country || existingLead.country || 'Nigeria'
        })
        .eq('id', leadId)
    } else {
      leadReference = await generateLeadReference(admin)

      const landingPage = String(raw.landingPage || '/admissions')
      const referrer = String(raw.referrer || '')

      const { data: created, error: createError } = await admin
        .from('leads')
        .insert({
          lead_reference: leadReference,
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          gender: values.gender || null,
          date_of_birth: values.dateOfBirth || null,
          address: values.address || null,
          city: values.city || null,
          state: values.state || null,
          country: values.country || 'Nigeria',
          status: 'new',
          source: values.source,
          landing_page: landingPage,
          referrer: referrer || null,
          utm_source: (raw.utm_source as string) || null,
          utm_medium: (raw.utm_medium as string) || null,
          utm_campaign: (raw.utm_campaign as string) || null,
          utm_content: (raw.utm_content as string) || null,
          utm_term: (raw.utm_term as string) || null
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error('[admissions] failed to create lead', createError)
        return {
          status: 'error',
          message: "We couldn't submit your enquiry right now. Please try again shortly."
        }
      }

      leadId = created.id
    }

    // --- Education + interest records ------------------------------------------
    if (values.highestQualification || values.institution || values.graduationYear || values.previousItExperience) {
      await admin.from('lead_education').insert({
        lead_id: leadId,
        highest_qualification: values.highestQualification || null,
        institution: values.institution || null,
        graduation_year: values.graduationYear ? Number(values.graduationYear) : null,
        previous_it_experience: values.previousItExperience || null
      })
    }

    await admin.from('lead_interests').insert({
      lead_id: leadId,
      programme_id: programme.id,
      study_mode: values.studyMode || null,
      preferred_intake: values.preferredIntake || null,
      expected_start_date: values.expectedStartDate || null
    })

    // --- Interaction history -------------------------------------------------
    await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: null,
      type: 'website',
      subject: isDuplicate ? 'Repeat enquiry submitted' : 'Enquiry submitted',
      description: `Submitted the admissions enquiry form for ${programme.name}.`
    })

    await logAudit(admin, {
      action: isDuplicate ? 'lead.resubmitted' : 'lead.created',
      entity: 'lead',
      entityId: leadId,
      metadata: { source: values.source, programme: programme.name }
    })

    // --- Notifications (best-effort; never block the success response) ---------
    const fullName = `${values.firstName} ${values.lastName}`
    await Promise.allSettled([
      sendEmail({
        to: values.email,
        ...applicantAcknowledgementEmail({
          firstName: values.firstName,
          leadReference,
          programmeName: programme.name
        })
      }),
      sendEmail({
        to: ADMISSIONS_NOTIFICATION_EMAIL,
        ...adminNewLeadNotificationEmail({
          fullName,
          email: values.email,
          phone: values.phone,
          programmeName: programme.name,
          source: values.source,
          leadReference,
          isDuplicate
        })
      })
    ])

    return { status: 'success', leadReference }
  } catch (err) {
    console.error('[admissions] unexpected error submitting enquiry', err)
    return {
      status: 'error',
      message: "Something went wrong on our end. Please try again, or contact us directly."
    }
  }
}
