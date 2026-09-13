import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { SocialPlatform } from '../types/db'

export interface PublicSocialLink {
  id: string
  platform: SocialPlatform
  label: string | null
  url: string
}

/**
 * `social_links` is staff-only under RLS (migration 0010). Runs entirely on
 * the server via the service-role client, filtered to is_published = true,
 * ordered the same way staff arrange them in the CRM.
 */
export async function getPublishedSocialLinks(): Promise<PublicSocialLink[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('social_links')
      .select('id, platform, label, url')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[social-links] failed to load published social links', error)
      return []
    }
    return (data ?? []) as PublicSocialLink[]
  } catch (err) {
    console.error('[social-links] unexpected error loading published social links', err)
    return []
  }
}
