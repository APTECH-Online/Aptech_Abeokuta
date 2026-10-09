'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '../../../lib/supabase/admin'
import { admissionsFormSchema, formatZodErrors } from '../../../lib/validation'
import { findExistingLead } from '../../../lib/duplicate'
import { generateLeadReference } from '../../../lib/reference'
import { checkRateLimit } from '../../../lib/rate-limit'
import { logAudit } from '../../../lib/audit'
import { sendEmail } from '../../../lib/email/send'
import { applicantAcknowledgementEmail } from '../../../lib/email/templates'
import { createNotification } from '../../../lib/notifications'
import { recordConsent, isUnder18 } from '../../../lib/consent'

export type SubmitEnquiryState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  leadReference?: string
  fieldErrors?: Record<string, string>
}

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
  const comparisonContext = String(raw.comparisonContext || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

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

    // Phase 6 attribution: first-touch is immutable; last-touch is refreshed
    // at the point of conversion. Campaign IDs are resolved server-side from
    // the existing campaign management table rather than trusting arbitrary IDs.
    const firstCampaignId = String(raw.first_touch_campaign_id || '')
    const lastCampaignId = String(raw.last_touch_campaign_id || '')
    const campaignIds = [...new Set([firstCampaignId, lastCampaignId].filter(Boolean))]
    let campaignRows: any[] = []
    if (campaignIds.length) {
      const { data: rows } = await admin.from('campaigns').select('id,campaign_identifier,name').in('id', campaignIds)
      campaignRows = rows ?? []
    }
    const campaignById = new Map(campaignRows.map((row: any) => [row.id, row]))
    const firstCampaign = campaignById.get(firstCampaignId)
    const lastCampaign = campaignById.get(lastCampaignId)
    const firstSource = String(raw.first_touch_source || raw.utm_source || values.source || 'unknown')
    const firstMedium = String(raw.first_touch_medium || raw.utm_medium || '')
    const firstCampaignName = String(raw.first_touch_campaign || firstCampaign?.campaign_identifier || '')
    const lastSource = String(raw.last_touch_source || raw.utm_source || values.source || 'unknown')
    const lastMedium = String(raw.last_touch_medium || raw.utm_medium || '')
    const lastCampaignName = String(raw.last_touch_campaign || lastCampaign?.campaign_identifier || '')
    const conversionPoint = String(raw.conversionPoint || 'enquiry_form')

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
          country: values.country || existingLead.country || 'Nigeria',
          first_touch_source: existingLead.first_touch_source || firstSource,
          first_touch_medium: existingLead.first_touch_medium || firstMedium || null,
          first_touch_campaign: existingLead.first_touch_campaign || firstCampaignName || null,
          first_touch_campaign_id: existingLead.first_touch_campaign_id || firstCampaign?.id || null,
          last_touch_source: lastSource,
          last_touch_medium: lastMedium || null,
          last_touch_campaign: lastCampaignName || null,
          last_touch_campaign_id: lastCampaign?.id || null,
          conversion_point: conversionPoint,
          attribution_landing_page: String(raw.landingPage || existingLead.landing_page || '/admissions'),
          attribution_referrer: String(raw.referrer || existingLead.referrer || '') || null,
          utm_source: String(raw.utm_source || existingLead.utm_source || '') || null,
          utm_medium: String(raw.utm_medium || existingLead.utm_medium || '') || null,
          utm_campaign: String(raw.utm_campaign || existingLead.utm_campaign || '') || null,
          utm_content: String(raw.utm_content || existingLead.utm_content || '') || null,
          utm_term: String(raw.utm_term || existingLead.utm_term || '') || null
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
          utm_term: (raw.utm_term as string) || null,
          first_touch_source: firstSource,
          first_touch_medium: firstMedium || null,
          first_touch_campaign: firstCampaignName || null,
          first_touch_campaign_id: firstCampaign?.id || null,
          last_touch_source: lastSource,
          last_touch_medium: lastMedium || null,
          last_touch_campaign: lastCampaignName || null,
          last_touch_campaign_id: lastCampaign?.id || null,
          conversion_point: conversionPoint,
          attribution_landing_page: landingPage,
          attribution_referrer: referrer || null
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

    // Attach anonymous programme-page visits from this browser session to the
    // now-identified CRM lead. This makes earlier intent useful without storing
    // names or contact details in anonymous page-view telemetry.
    const analyticsSessionId = String(raw.analyticsSessionId || '').slice(0, 120)
    if (analyticsSessionId) {
      const { error: sessionLinkError } = await admin.from('conversion_events')
        .update({ lead_id: leadId })
        .eq('session_id', analyticsSessionId)
        .is('lead_id', null)
        .in('event_name', ['programme_page_viewed', 'fee_inquiry'])
      if (sessionLinkError) console.error('[admissions] failed to link programme page-view history', sessionLinkError)
    }

    // Record a fee-intent signal when this enquiry came from a fee-specific CTA.
    // The lead score trigger recalculates transparently from this event.
    if (/fee|tuition|payment/i.test(conversionPoint)) {
      const { error: scoreEventError } = await admin.from('conversion_events').insert({
        event_name: 'fee_inquiry', lead_id: leadId,
        metadata: { conversionPoint, programmeId: programme.id, programmeName: programme.name }
      })
      if (scoreEventError) console.error('[admissions] failed to record fee-intent score signal', scoreEventError)
    }

    // --- Education + interest records ------------------------------------------
    // These are supplementary to the core lead record: if one of these writes
    // fails we still want the applicant to see a success response (their
    // primary lead record was saved), but the failure must never be silently
    // dropped — log it loudly so staff/ops can recover the missing detail.
    if (values.highestQualification || values.institution || values.graduationYear || values.previousItExperience) {
      const { error: educationError } = await admin.from('lead_education').insert({
        lead_id: leadId,
        highest_qualification: values.highestQualification || null,
        institution: values.institution || null,
        graduation_year: values.graduationYear ? Number(values.graduationYear) : null,
        previous_it_experience: values.previousItExperience || null
      })
      if (educationError) {
        console.error('[admissions] failed to save education details', educationError, { leadId })
      }
    }

    const { error: interestError } = await admin.from('lead_interests').insert({
      lead_id: leadId,
      programme_id: programme.id,
      study_mode: values.studyMode || null,
      preferred_intake: values.preferredIntake || null,
      expected_start_date: values.expectedStartDate || null
    })
    if (interestError) {
      console.error('[admissions] failed to save programme interest', interestError, { leadId })
    }

    // --- Interaction history -------------------------------------------------
    const { error: interactionError } = await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: null,
      type: 'website',
      subject: isDuplicate ? 'Repeat enquiry submitted' : 'Enquiry submitted',
      description: `Submitted the admissions enquiry form for ${programme.name}.${comparisonContext.length ? ` Compared programmes: ${comparisonContext.join(', ')}.` : ''}`
    })
    if (interactionError) {
      console.error('[admissions] failed to log enquiry interaction', interactionError, { leadId })
    }

    // --- Consent ledger + under-18 flag -----------------------------------------
    const minor = isUnder18(values.dateOfBirth)
    await recordConsent(admin, {
      leadId,
      source: 'admissions',
      marketingOptIn: values.marketingOptIn === 'yes',
      minor,
      page: '/admissions'
    })
    if (minor) {
      await admin.from('interactions').insert({
        lead_id: leadId,
        user_id: null,
        type: 'website',
        subject: 'Applicant appears to be under 18',
        description: 'Date of birth indicates the applicant is under 18. Confirm parent or guardian agreement before enrolment.'
      })
    }

    await logAudit(admin, {
      action: isDuplicate ? 'lead.resubmitted' : 'lead.created',
      entity: 'lead',
      entityId: leadId,
      metadata: { source: values.source, programme: programme.name, comparedProgrammes: comparisonContext }
    })

    // --- Notifications (best-effort; never block the success response) ---------
    // Staff-facing alerts live inside the CRM (Notifications page + sidebar
    // badge) rather than email, since no email provider is configured. The
    // applicant still gets an acknowledgement email attempt (harmless no-op
    // until a provider is wired up — see lib/email/send.ts).
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
      createNotification(admin, {
        type: isDuplicate ? 'lead.resubmitted' : 'lead.created',
        title: isDuplicate ? `${fullName} enquired again` : `New enquiry from ${fullName}`,
        body: `${programme.name} · ${values.source}${leadReference ? ` · Ref ${leadReference}` : ''}`,
        link: `/admin/leads/${leadId}`,
        entity: 'lead',
        entityId: leadId,
        targetRoles: ['admissions_officer', 'super_admin']
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
