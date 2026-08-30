import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a sequential-looking, human-friendly reference such as
 * APC-2026-000124, based on how many rows already exist this year.
 * Retries on the (rare) chance of a collision from concurrent submissions.
 */
async function generateReference(
  admin: SupabaseClient,
  table: 'leads' | 'applications',
  column: 'lead_reference' | 'application_reference',
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear()
  const yearPrefix = `${prefix}-${year}-`

  for (let attempt = 0; attempt < 5; attempt++) {
    const { count } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .like(column, `${yearPrefix}%`)

    const next = (count ?? 0) + 1 + attempt
    const candidate = `${yearPrefix}${String(next).padStart(6, '0')}`

    const { data: existing } = await admin
      .from(table)
      .select('id')
      .eq(column, candidate)
      .maybeSingle()

    if (!existing) return candidate
  }

  // Extremely unlikely fallback: timestamp-based suffix guarantees uniqueness.
  return `${yearPrefix}${Date.now().toString().slice(-6)}`
}

export function generateLeadReference(admin: SupabaseClient) {
  return generateReference(admin, 'leads', 'lead_reference', 'APC')
}

export function generateApplicationReference(admin: SupabaseClient) {
  return generateReference(admin, 'applications', 'application_reference', 'APP')
}
