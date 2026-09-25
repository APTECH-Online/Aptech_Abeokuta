import 'server-only'
import { createClient } from '../supabase/server'
import { requireRole } from '../auth'
import type { GalleryItem } from '../../types/db'

export interface GalleryFilter {
  search?: string
  category?: string
  status?: 'published' | 'unpublished' | ''
  page?: number
  pageSize?: number
}

/**
 * Reads use the session-bound server client (RLS: any active staff can
 * select — see migration 0006). Mutations go through the admin client in
 * app/admin/(dashboard)/gallery/actions.ts, same split used across the
 * rest of the CRM.
 */
export async function getGalleryItems(filter: GalleryFilter) {
  await requireRole('super_admin')
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('gallery_items').select('*', { count: 'exact' }).order('sort_order', { ascending: true })

  if (filter.search) {
    const s = filter.search.replace(/[%_]/g, '')
    query = query.or(`title.ilike.%${s}%,alt_text.ilike.%${s}%`)
  }
  if (filter.category) query = query.eq('category', filter.category)
  if (filter.status === 'published') query = query.eq('is_published', true)
  if (filter.status === 'unpublished') query = query.eq('is_published', false)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load gallery items', error)
    return { items: [] as GalleryItem[], total: 0, page, pageSize }
  }

  return { items: (data ?? []) as GalleryItem[], total: count ?? 0, page, pageSize }
}

export async function getGalleryItemById(id: string): Promise<GalleryItem | null> {
  await requireRole('super_admin')
  const supabase = await createClient()
  const { data, error } = await supabase.from('gallery_items').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as GalleryItem
}

/** Highest sort_order currently in use, for placing a new item at the end. */
export async function getNextSortOrder(): Promise<number> {
  await requireRole('super_admin')
  const supabase = await createClient()
  const { data } = await supabase
    .from('gallery_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { sort_order: number } | null)?.sort_order ?? 0) + 1
}
