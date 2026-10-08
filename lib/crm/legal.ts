import 'server-only'
import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { DEFAULT_LEGAL, LEGAL_SLUGS, type LegalSection, type LegalSlug } from '../../data/legal'

export type LegalRow = {
  id: string
  slug: LegalSlug
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  summary: string | null
  sections: LegalSection[]
  effective_date: string | null
  change_summary: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Makes sure every document has a version 1 row (the built-in defaults,
 * published) so the CRM has something to edit and the version history is
 * complete. Idempotent: a row that already exists is never touched.
 */
export async function ensureLegalSeeded() {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('legal_documents').select('slug')
    const have = new Set((data ?? []).map((r: { slug: string }) => r.slug))
    const missing = LEGAL_SLUGS.filter((slug) => !have.has(slug))
    if (!missing.length) return
    await admin.from('legal_documents').upsert(
      missing.map((slug) => {
        const d = DEFAULT_LEGAL[slug]
        return {
          slug,
          version: d.version,
          status: 'published',
          title: d.title,
          summary: d.summary,
          sections: d.sections,
          effective_date: d.effectiveDate,
          change_summary: 'Initial version.',
          published_at: new Date().toISOString()
        }
      }),
      { onConflict: 'slug,version', ignoreDuplicates: true }
    )
  } catch (err) {
    console.error('[legal] failed to seed default documents', err)
  }
}

export async function listLegalDocuments(slug?: LegalSlug): Promise<LegalRow[]> {
  const supabase = await createClient()
  let query = supabase.from('legal_documents').select('*').order('version', { ascending: false })
  if (slug) query = query.eq('slug', slug)
  const { data, error } = await query
  if (error) {
    console.error('[legal] failed to list documents', error)
    return []
  }
  return (data ?? []) as LegalRow[]
}

export async function getConsentOverview() {
  const supabase = await createClient()
  const count = async (build: (q: any) => any) => {
    const { count: c } = await build(supabase.from('leads').select('id', { count: 'exact', head: true }))
    return c ?? 0
  }
  const [total, withConsent, marketing, minors] = await Promise.all([
    count((q) => q),
    count((q) => q.not('privacy_consent_at', 'is', null)),
    count((q) => q.eq('marketing_opt_in', true)),
    supabase.from('lead_consents').select('lead_id', { count: 'exact', head: true }).eq('minor_flag', true).then((r) => r.count ?? 0)
  ])
  return { total, withConsent, withoutConsent: Math.max(0, total - withConsent), marketing, minors }
}
