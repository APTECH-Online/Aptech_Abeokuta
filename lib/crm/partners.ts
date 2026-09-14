import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { PartnerOrganization, AffiliatedUniversity, PartnersHighlight } from '../../types/db'

export interface PartnersFilter {
  status?: 'published' | 'unpublished' | ''
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------------------
// Partner organizations (About page "Industry partners" cards)
// ---------------------------------------------------------------------------

export async function getPartnerOrganizations(filter: PartnersFilter = {}) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('partner_organizations').select('*', { count: 'exact' }).order('sort_order', { ascending: true })
  if (filter.status === 'published') query = query.eq('is_published', true)
  if (filter.status === 'unpublished') query = query.eq('is_published', false)
  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) {
    console.error('[crm] failed to load partner organizations', error)
    return { items: [] as PartnerOrganization[], total: 0, page, pageSize }
  }
  return { items: (data ?? []) as PartnerOrganization[], total: count ?? 0, page, pageSize }
}

export async function getPartnerOrganizationById(id: string): Promise<PartnerOrganization | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase.from('partner_organizations').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as PartnerOrganization
}

export async function getNextPartnerOrgSortOrder(): Promise<number> {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('partner_organizations')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { sort_order: number } | null)?.sort_order ?? 0) + 1
}

// ---------------------------------------------------------------------------
// Affiliated universities (logo grid on Home + About)
// ---------------------------------------------------------------------------

export async function getAffiliatedUniversities(filter: PartnersFilter = {}) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('affiliated_universities').select('*', { count: 'exact' }).order('sort_order', { ascending: true })
  if (filter.status === 'published') query = query.eq('is_published', true)
  if (filter.status === 'unpublished') query = query.eq('is_published', false)
  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) {
    console.error('[crm] failed to load affiliated universities', error)
    return { items: [] as AffiliatedUniversity[], total: 0, page, pageSize }
  }
  return { items: (data ?? []) as AffiliatedUniversity[], total: count ?? 0, page, pageSize }
}

export async function getAffiliatedUniversityById(id: string): Promise<AffiliatedUniversity | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase.from('affiliated_universities').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as AffiliatedUniversity
}

export async function getNextUniversitySortOrder(): Promise<number> {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('affiliated_universities')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { sort_order: number } | null)?.sort_order ?? 0) + 1
}

// ---------------------------------------------------------------------------
// Partners highlight (singleton homepage card)
// ---------------------------------------------------------------------------

/** There is only ever meant to be one row; this returns the earliest one. */
export async function getPartnersHighlight(): Promise<PartnersHighlight | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partners_highlight')
    .select('*')
    .order('updated_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as PartnersHighlight
}
