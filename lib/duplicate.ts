import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '../types/db'

/**
 * Looks for an existing lead that matches on email, phone, or WhatsApp
 * number so the CRM keeps one primary profile per person instead of
 * fragmenting their history across duplicate rows.
 *
 * Match priority: exact email match first (most reliable unique identifier),
 * then phone, then WhatsApp.
 */
export async function findExistingLead(
  admin: SupabaseClient,
  { email, phone, whatsapp }: { email: string; phone: string; whatsapp?: string | null }
): Promise<Lead | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = normalizePhone(phone)
  const normalizedWhatsapp = whatsapp ? normalizePhone(whatsapp) : null

  const { data: byEmail } = await admin
    .from('leads')
    .select('*')
    .ilike('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (byEmail) return byEmail as Lead

  if (normalizedPhone) {
    const { data: allLeads } = await admin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    const byPhone = (allLeads ?? []).find((l: Lead) => {
      return (
        normalizePhone(l.phone) === normalizedPhone ||
        (l.whatsapp && normalizePhone(l.whatsapp) === normalizedPhone) ||
        (normalizedWhatsapp && normalizePhone(l.phone) === normalizedWhatsapp) ||
        (normalizedWhatsapp && l.whatsapp && normalizePhone(l.whatsapp) === normalizedWhatsapp)
      )
    })

    if (byPhone) return byPhone as Lead
  }

  return null
}

function normalizePhone(value: string): string {
  // Strip everything but digits, then drop a leading country/trunk prefix
  // variance (e.g. "0803..." vs "+234803...") by comparing the last 10 digits.
  const digits = value.replace(/\D/g, '')
  return digits.slice(-10)
}
