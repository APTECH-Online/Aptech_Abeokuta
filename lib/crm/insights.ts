import 'server-only'
import { createClient } from '../supabase/server'
import { requireInsightsAccess } from '../auth'
import type { Insight, InsightContentType, InsightStatus } from '../../types/db'

export interface InsightsFilter {
  search?: string
  status?: InsightStatus | ''
  category?: string
  contentType?: InsightContentType | ''
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface InsightRow extends Insight {
  authorName: string | null
}

/**
 * Reads use the session-bound server client (RLS: any active staff can
 * select — see migration 0004). Mutations go through the admin client in
 * app/admin/(dashboard)/insights/actions.ts, same split used across the
 * rest of the CRM (compare lib/crm/leads.ts vs. the programmes actions).
 */
export async function getInsights(filter: InsightsFilter) {
  await requireInsightsAccess()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('insights')
    .select('*, staff:author_id(full_name)', { count: 'exact' })
    .order('updated_at', { ascending: false })

  if (filter.search) {
    const s = filter.search.replace(/[%_]/g, '')
    query = query.or(`title.ilike.%${s}%,short_description.ilike.%${s}%,slug.ilike.%${s}%`)
  }
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.category) query = query.eq('category', filter.category)
  if (filter.contentType) query = query.eq('content_type', filter.contentType)
  if (filter.dateFrom) query = query.gte('created_at', filter.dateFrom)
  if (filter.dateTo) query = query.lte('created_at', `${filter.dateTo}T23:59:59`)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load insights', error)
    return { insights: [] as InsightRow[], total: 0, page, pageSize }
  }

  const rows: InsightRow[] = (data ?? []).map((row: any) => ({
    ...row,
    authorName: row.staff?.full_name ?? null
  }))

  return { insights: rows, total: count ?? 0, page, pageSize }
}

export async function getInsightById(id: string): Promise<InsightRow | null> {
  await requireInsightsAccess()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insights')
    .select('*, staff:author_id(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return { ...(data as any), authorName: (data as any).staff?.full_name ?? null }
}

export interface InsightsDashboardStats {
  total: number
  drafts: number
  scheduled: number
  published: number
  upcomingEvents: number
  nextScheduled: { id: string; title: string; publishAt: string }[]
  nextEvents: { id: string; title: string; eventStartAt: string; venue: string | null }[]
}

export async function getInsightsDashboardStats(): Promise<InsightsDashboardStats> {
  await requireInsightsAccess()
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const [{ count: total }, { count: drafts }, { count: scheduled }, { count: published }, { data: upcomingEventsRaw }, { data: nextScheduledRaw }] =
    await Promise.all([
      supabase.from('insights').select('id', { count: 'exact', head: true }),
      supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase
        .from('insights')
        .select('id, title, event_start_at, event_venue')
        .eq('content_type', 'event')
        .eq('status', 'published')
        .gte('event_start_at', nowIso)
        .order('event_start_at', { ascending: true })
        .limit(5),
      supabase
        .from('insights')
        .select('id, title, publish_at')
        .eq('status', 'scheduled')
        .order('publish_at', { ascending: true })
        .limit(5)
    ])

  const upcomingEvents = upcomingEventsRaw ?? []

  return {
    total: total ?? 0,
    drafts: drafts ?? 0,
    scheduled: scheduled ?? 0,
    published: published ?? 0,
    upcomingEvents: upcomingEvents.length,
    nextScheduled: (nextScheduledRaw ?? []).map((r: any) => ({ id: r.id, title: r.title, publishAt: r.publish_at })),
    nextEvents: upcomingEvents.map((r: any) => ({
      id: r.id,
      title: r.title,
      eventStartAt: r.event_start_at,
      venue: r.event_venue
    }))
  }
}

/** Used by the editor to warn about (and the action to reject) duplicate slugs. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  await requireInsightsAccess()
  const supabase = await createClient()
  let query = supabase.from('insights').select('id').eq('slug', slug).limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return !!data && data.length > 0
}

export async function getInsightAuthors() {
  await requireInsightsAccess()
  const supabase = await createClient()
  const { data } = await supabase.from('staff').select('id, full_name').eq('is_active', true).order('full_name')
  return data ?? []
}
