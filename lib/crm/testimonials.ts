import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { Testimonial } from '../../types/db'

export interface TestimonialsFilter {
  search?: string
  status?: 'published' | 'unpublished' | ''
  page?: number
  pageSize?: number
}

export async function getTestimonials(filter: TestimonialsFilter) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('testimonials').select('*', { count: 'exact' }).order('sort_order', { ascending: true })

  if (filter.search) {
    const s = filter.search.replace(/[%_]/g, '')
    query = query.or(`name.ilike.%${s}%,program.ilike.%${s}%,quote.ilike.%${s}%`)
  }
  if (filter.status === 'published') query = query.eq('is_published', true)
  if (filter.status === 'unpublished') query = query.eq('is_published', false)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load testimonials', error)
    return { items: [] as Testimonial[], total: 0, page, pageSize }
  }

  return { items: (data ?? []) as Testimonial[], total: count ?? 0, page, pageSize }
}

export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as Testimonial
}

export async function getNextTestimonialSortOrder(): Promise<number> {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('testimonials')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { sort_order: number } | null)?.sort_order ?? 0) + 1
}
