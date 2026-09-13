import 'server-only'
import { createAdminClient } from './supabase/admin'

export interface PublicTestimonial {
  id: string
  name: string
  program: string
  quote: string
  image_url: string | null
}

/**
 * `testimonials` is staff-only under RLS (migration 0008). Runs entirely on
 * the server via the service-role client, filtered to is_published = true.
 * `limit` lets the homepage summary grab just the first few, while the full
 * /testimonials page omits it to get everything.
 */
export async function getPublishedTestimonials(limit?: number): Promise<PublicTestimonial[]> {
  try {
    const admin = createAdminClient()
    let query = admin
      .from('testimonials')
      .select('id, name, program, quote, image_url')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      console.error('[testimonials] failed to load published testimonials', error)
      return []
    }
    return (data ?? []) as PublicTestimonial[]
  } catch (err) {
    console.error('[testimonials] unexpected error loading published testimonials', err)
    return []
  }
}
