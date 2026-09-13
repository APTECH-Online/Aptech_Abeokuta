import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { SocialLink } from '../../types/db'

// Re-exported so existing staff-side imports of SOCIAL_PLATFORMS from this
// module keep working. The values themselves live in lib/social-platforms.ts
// (no 'server-only'/Supabase deps) so client components like
// components/admin/SocialLinkForm.tsx can import them directly.
export { SOCIAL_PLATFORMS } from '../social-platforms'

export interface SocialLinksFilter {
  status?: 'published' | 'unpublished' | ''
  page?: number
  pageSize?: number
}

export async function getSocialLinks(filter: SocialLinksFilter = {}) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('social_links').select('*', { count: 'exact' }).order('sort_order', { ascending: true })

  if (filter.status === 'published') query = query.eq('is_published', true)
  if (filter.status === 'unpublished') query = query.eq('is_published', false)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load social links', error)
    return { items: [] as SocialLink[], total: 0, page, pageSize }
  }

  return { items: (data ?? []) as SocialLink[], total: count ?? 0, page, pageSize }
}

export async function getSocialLinkById(id: string): Promise<SocialLink | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase.from('social_links').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as SocialLink
}

export async function getNextSocialLinkSortOrder(): Promise<number> {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('social_links')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { sort_order: number } | null)?.sort_order ?? 0) + 1
}
