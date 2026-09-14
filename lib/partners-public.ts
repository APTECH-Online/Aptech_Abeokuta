import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { PartnerOrganization, AffiliatedUniversity, PartnersHighlight } from '../types/db'

/**
 * All three tables here are staff-only under RLS (migration 0011). These
 * run entirely on the server via the service-role client, filtered to
 * is_published = true, ordered the same way staff arrange them in the CRM.
 */

export async function getPublishedPartnerOrganizations(): Promise<PartnerOrganization[]> {
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
}

export async function getPublishedAffiliatedUniversities(): Promise<AffiliatedUniversity[]> {
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
}

export async function getPublishedPartnersHighlight(): Promise<PartnersHighlight | null> {
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
}
