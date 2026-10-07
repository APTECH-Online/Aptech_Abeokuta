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

  if (normalizedPhone || normalizedWhatsapp) {
    const candidates = new Set<string>()
    if (phone.trim()) candidates.add(phone.trim())
    if (whatsapp?.trim()) candidates.add(whatsapp.trim())

    const [{ data: byPhone }, { data: byWhatsapp }] = await Promise.all([
      candidates.size ? admin.from('leads').select('*').in('phone', Array.from(candidates)).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] as Lead[] }),
      candidates.size ? admin.from('leads').select('*').in('whatsapp', Array.from(candidates)).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] as Lead[] })
    ])
    const exact = [...(byPhone ?? []), ...(byWhatsapp ?? [])][0]
    if (exact) return exact as Lead

    // Fallback for common Nigeria formatting differences (0803… vs +234803…).
    const { data: recentLeads } = await admin.from('leads').select('*').order('created_at', { ascending: false }).limit(1000)
    const match = (recentLeads ?? []).find((l: Lead) =>
      (normalizedPhone && (normalizePhone(l.phone) === normalizedPhone || (l.whatsapp && normalizePhone(l.whatsapp) === normalizedPhone))) ||
      (normalizedWhatsapp && (normalizePhone(l.phone) === normalizedWhatsapp || (l.whatsapp && normalizePhone(l.whatsapp) === normalizedWhatsapp)))
    )
    if (match) return match as Lead
  }

  return null
}

function normalizePhone(value: string): string {
  // Strip everything but digits, then drop a leading country/trunk prefix
  // variance (e.g. "0803..." vs "+234803...") by comparing the last 10 digits.
  const digits = value.replace(/\D/g, '')
  return digits.slice(-10)
}
