import 'server-only'
import type { createAdminClient } from './supabase/admin'
import { findExistingLead } from './duplicate'
import { generateLeadReference } from './reference'

type Admin = ReturnType<typeof createAdminClient>

export function safeAttribution(raw: unknown) {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const s = (k: string, n = 120) => String(a[k] ?? '').slice(0, n)
  return {
    firstSource: s('firstSource'), firstMedium: s('firstMedium'), firstCampaign: s('firstCampaign'), firstCampaignId: s('firstCampaignId'),
    lastSource: s('lastSource'), lastMedium: s('lastMedium'), lastCampaign: s('lastCampaign'), lastCampaignId: s('lastCampaignId'),
    landingPage: s('landingPage', 240), referrer: s('referrer', 500)
  }
}

/** Matches an existing CRM lead (email/phone) or creates one with source = tech_challenge. */
export async function upsertPlaygroundLead(admin: Admin, input: { name: string; email: string; phone: string; attribution: ReturnType<typeof safeAttribution>; conversionPoint: string; page: string }) {
  const { name, email, phone, attribution, conversionPoint, page } = input
  const existing = await findExistingLead(admin, { email: email || `playground-${crypto.randomUUID()}@lead.invalid`, phone: phone || 'Not provided' })
  if (existing && (email || phone)) return { id: existing.id as string, lead_reference: existing.lead_reference as string }
  const parts = name.split(/\s+/)
  const ref = await generateLeadReference(admin)
  const { data, error } = await admin.from('leads').insert({
    lead_reference: ref, first_name: parts[0], last_name: parts.slice(1).join(' ') || '—',
    email: email || `playground-${crypto.randomUUID()}@lead.invalid`, phone: phone || 'Not provided', status: 'new', source: 'tech_challenge',
    landing_page: attribution.landingPage || page, referrer: attribution.referrer || null,
    utm_source: attribution.lastSource || null, utm_medium: attribution.lastMedium || null, utm_campaign: attribution.lastCampaign || null,
    first_touch_source: attribution.firstSource || null, first_touch_medium: attribution.firstMedium || null, first_touch_campaign: attribution.firstCampaign || null, first_touch_campaign_id: attribution.firstCampaignId || null,
    last_touch_source: attribution.lastSource || null, last_touch_medium: attribution.lastMedium || null, last_touch_campaign: attribution.lastCampaign || null, last_touch_campaign_id: attribution.lastCampaignId || null,
    conversion_point: conversionPoint, attribution_landing_page: attribution.landingPage || page, attribution_referrer: attribution.referrer || null
  }).select('id,lead_reference').single()
  if (error || !data) throw error || new Error('Lead creation failed')
  return data as { id: string; lead_reference: string }
}
