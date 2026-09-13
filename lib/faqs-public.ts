import 'server-only'
import { createAdminClient } from './supabase/admin'

export interface PublicFaq {
  id: string
  question: string
  answer: string
}

/**
 * `faqs` is staff-only under RLS (migration 0009). Runs entirely on the
 * server via the service-role client, filtered to is_published = true.
 * `limit` preserves the Admissions page's old faqs.slice(0, 3) behaviour;
 * the homepage FAQ section omits it to show everything.
 */
export async function getPublishedFaqs(limit?: number): Promise<PublicFaq[]> {
  try {
    const admin = createAdminClient()
    let query = admin
      .from('faqs')
      .select('id, question, answer')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      console.error('[faqs] failed to load published faqs', error)
      return []
    }
    return (data ?? []) as PublicFaq[]
  } catch (err) {
    console.error('[faqs] unexpected error loading published faqs', err)
    return []
  }
}
