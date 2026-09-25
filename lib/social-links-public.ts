import 'server-only'
import { cache } from 'react'
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
 *
 * Wrapped in React's cache() — both the Footer and the root layout's
 * organizationJsonLd need this on every page, so this dedupes them to one
 * query per request rather than two. See lib/contact-info-public.ts for
 * the same pattern with more call sites.
 */
export const getPublishedSocialLinks = cache(async (): Promise<PublicSocialLink[]> => {
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
})
