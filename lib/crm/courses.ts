import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { Course, CourseCategory, CourseStatus } from '../../types/db'

export interface CoursesFilter {
  search?: string
  category?: CourseCategory | ''
  status?: CourseStatus | ''
  page?: number
  pageSize?: number
}

/**
 * Reads use the session-bound server client (RLS: any active staff can
 * select — see migration 0007). Mutations go through the admin client in
 * app/admin/(dashboard)/courses/actions.ts.
 */
export async function getCourses(filter: CoursesFilter) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .order('category', { ascending: true })
    .order('display_order', { ascending: true })

  if (filter.search) {
    const s = filter.search.replace(/[%_]/g, '')
    query = query.or(`title.ilike.%${s}%,summary.ilike.%${s}%,slug.ilike.%${s}%`)
  }
  if (filter.category) query = query.eq('category', filter.category)
  if (filter.status) query = query.eq('status', filter.status)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load courses', error)
    return { courses: [] as Course[], total: 0, page, pageSize }
  }

  return { courses: (data ?? []) as Course[], total: count ?? 0, page, pageSize }
}

export async function getCourseById(id: string): Promise<Course | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as Course
}

export async function isCourseSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  await requireStaff()
  const supabase = await createClient()
  let query = supabase.from('courses').select('id').eq('slug', slug).limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return (data?.length ?? 0) > 0
}
