import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentLegalVersions } from './legal-public'

export type ConsentSource = 'admissions' | 'contact' | 'career_quiz' | 'tech_zone'

/** True when the date of birth (YYYY-MM-DD) indicates someone under 18. */
export function isUnder18(dateOfBirth?: string | null, now = new Date()): boolean {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false
  const dob = new Date(`${dateOfBirth}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) return false
  const eighteen = new Date(Date.UTC(dob.getUTCFullYear() + 18, dob.getUTCMonth(), dob.getUTCDate()))
  return eighteen.getTime() > now.getTime()
}

/**
 * Appends a row to the consent ledger and refreshes the quick-filter columns
 * on the lead. Best-effort by design: a consent-logging failure is logged
 * loudly but must never lose the enquiry itself.
 */
export async function recordConsent(
  admin: SupabaseClient,
  input: { leadId: string; source: ConsentSource; marketingOptIn?: boolean; minor?: boolean; page?: string }
) {
  try {
    const versions = await getCurrentLegalVersions()
    const { error } = await admin.from('lead_consents').insert({
      lead_id: input.leadId,
      form_source: input.source,
      privacy_accepted: true,
      marketing_opt_in: Boolean(input.marketingOptIn),
      privacy_version: versions.privacy,
      terms_version: versions.terms,
      minor_flag: Boolean(input.minor),
      page: input.page ?? null
    })
    if (error) {
      console.error('[consent] failed to record consent', error, { leadId: input.leadId })
      return
    }
    const patch: Record<string, unknown> = { privacy_consent_at: new Date().toISOString() }
    // Only ever turn marketing on from a fresh opt-in; withdrawal is handled by staff in the CRM.
    if (input.marketingOptIn) patch.marketing_opt_in = true
    const { error: leadError } = await admin.from('leads').update(patch).eq('id', input.leadId)
    if (leadError) console.error('[consent] failed to update lead consent flags', leadError, { leadId: input.leadId })
  } catch (err) {
    console.error('[consent] unexpected error recording consent', err)
  }
}

export const formFlag = (value: FormDataEntryValue | null | undefined) => {
  const v = String(value ?? '').toLowerCase()
  return v === 'yes' || v === 'on' || v === 'true' || v === '1'
}
