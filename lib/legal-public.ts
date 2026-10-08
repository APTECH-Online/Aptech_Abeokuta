import 'server-only'
import { cache } from 'react'
import { createAdminClient } from './supabase/admin'
import { DEFAULT_LEGAL, type LegalDoc, type LegalSlug } from '../data/legal'

/**
 * The published version of a legal document. Falls back to the built-in
 * default (data/legal.ts) if the table is empty, missing or unreadable, so
 * /privacy and /terms can never render blank.
 */
export const getPublishedLegal = cache(async (slug: LegalSlug): Promise<LegalDoc> => {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('legal_documents')
      .select('slug, version, title, summary, sections, effective_date, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !data) return DEFAULT_LEGAL[slug]
    return {
      slug,
      version: data.version,
      title: data.title,
      summary: data.summary ?? '',
      effectiveDate: data.effective_date ?? String(data.published_at ?? '').slice(0, 10),
      sections: Array.isArray(data.sections) ? data.sections : []
    }
  } catch {
    return DEFAULT_LEGAL[slug]
  }
})

/** Versions currently in force, stored with every consent record. */
export async function getCurrentLegalVersions(): Promise<{ privacy: number; terms: number }> {
  const [privacy, terms] = await Promise.all([getPublishedLegal('privacy'), getPublishedLegal('terms')])
  return { privacy: privacy.version, terms: terms.version }
}
