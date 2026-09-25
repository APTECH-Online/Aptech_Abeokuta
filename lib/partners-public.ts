import 'server-only'
import { cache } from 'react'
import { createAdminClient } from './supabase/admin'
import type { PartnerOrganization, AffiliatedUniversity, PartnersHighlight } from '../types/db'

/**
 * All three tables here are staff-only under RLS (migration 0011). These
 * run entirely on the server via the service-role client, filtered to
 * is_published = true, ordered the same way staff arrange them in the CRM.
 *
 * Each is wrapped in React's cache() so that if a page ever ends up calling
 * one of these more than once in a single render (as happened organically
 * with getPublicContactInfo — see lib/contact-info-public.ts), it dedupes
 * to a single query for free rather than needing a second look later.
 */

export const getPublishedPartnerOrganizations = cache(async (): Promise<PartnerOrganization[]> => {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('partner_organizations')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[partners] failed to load published partner organizations', error)
      return []
    }
    return (data ?? []) as PartnerOrganization[]
  } catch (err) {
    console.error('[partners] unexpected error loading published partner organizations', err)
    return []
  }
})

export const getPublishedAffiliatedUniversities = cache(async (): Promise<AffiliatedUniversity[]> => {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliated_universities')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[partners] failed to load published affiliated universities', error)
      return []
    }
    return (data ?? []) as AffiliatedUniversity[]
  } catch (err) {
    console.error('[partners] unexpected error loading published affiliated universities', err)
    return []
  }
})

export const getPublishedPartnersHighlight = cache(async (): Promise<PartnersHighlight | null> => {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('partners_highlight')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return data as PartnersHighlight
  } catch (err) {
    console.error('[partners] unexpected error loading partners highlight', err)
    return null
  }
})
