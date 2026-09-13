import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { GalleryDisplaySize } from '../types/db'

/**
 * `gallery_items` is staff-only under RLS (see migration 0006, same model
 * as lib/insights-public.ts for Insights). This runs entirely on the
 * server, uses the service-role client, and returns only the public-safe
 * fields the site needs — never uploaded_by or the service-role key reach
 * the browser. Always filters at the database level for is_published =
 * true, so drafts can never leak onto the public page.
 */

export interface PublicGalleryItem {
  id: string
  title: string
  category: string
  alt_text: string
  image_url: string
  display_size: GalleryDisplaySize
}

export async function getPublishedGalleryItems(): Promise<PublicGalleryItem[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('gallery_items')
      .select('id, title, category, alt_text, image_url, display_size')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[gallery] failed to load published items', error)
      return []
    }
    return (data ?? []) as PublicGalleryItem[]
  } catch (err) {
    console.error('[gallery] unexpected error loading published items', err)
    return []
  }
}
