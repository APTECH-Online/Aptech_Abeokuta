import 'server-only'
import { createClient } from '../supabase/server'
import { requireInsightsAccess, insightPermissionModule } from '../auth'
import { hasPermission } from '../permissions'
import type { Insight, InsightContentType, InsightStatus, Staff } from '../../types/db'

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
 * Content types this staff member may view, given the news/events split
 * (spec section 3: a Content Manager may hold one, both, or neither).
 * Super Admin and Admissions Officer/other roles are handled by the caller
 * (requireInsightsAccess already rejects non-content-managers who aren't
 * Super Admin before this is used) — returning 'all' short-circuits the
 * filter for Super Admin.
 */
function allowedContentTypes(staff: Staff): 'all' | InsightContentType[] {
  if (staff.role === 'super_admin') return 'all'
  const types: InsightContentType[] = []
  if (hasPermission(staff, 'news.view')) {
    types.push('news', 'announcement', 'academic_update', 'spotlight', 'achievement', 'career_update', 'celebration')
  }
  if (hasPermission(staff, 'events.view')) types.push('event')
  return types
}

/**
 * Reads use the session-bound server client (RLS: any active staff can
 * select — see migration 0004). Mutations go through the admin client in
 * app/admin/(dashboard)/insights/actions.ts, same split used across the
 * rest of the CRM (compare lib/crm/leads.ts vs. the programmes actions).
 */
export async function getInsights(filter: InsightsFilter) {
  const staff = await requireInsightsAccess()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('insights')
    .select('*, staff:author_id(full_name)', { count: 'exact' })
    .order('updated_at', { ascending: false })

  // Data-level security (spec section 10): a Content Manager granted only
  // News or only Events must never see the other module's rows, in the
  // list, in search, or in a requested contentType filter.
  const allowed = allowedContentTypes(staff)
  if (allowed !== 'all') {
    if (filter.contentType && !allowed.includes(filter.contentType)) {
      return { insights: [] as InsightRow[], total: 0, page, pageSize }
    }
    query = query.in('content_type', allowed.length > 0 ? allowed : ['__none__'])
  }

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
  const staff = await requireInsightsAccess()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insights')
    .select('*, staff:author_id(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  // Direct-URL / IDOR guard: a Content Manager who can only view News must
  // not be able to reach an Event (or vice versa) by guessing/typing an id.
  const allowed = allowedContentTypes(staff)
  if (allowed !== 'all' && !allowed.includes((data as any).content_type)) return null

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

/**
 * Powers the dashboard's content KPIs. In addition to ordinary Insights view
 * access, a Content Manager must also hold `dashboard_access` and
 * `dashboard_view_content_stats` (spec section 4) — a CM can be allowed to
 * edit News/Events without necessarily seeing them summarized on the shared
 * dashboard.
 */
export async function getInsightsDashboardStats(): Promise<InsightsDashboardStats> {
  const staff = await requireInsightsAccess()
  if (staff.role === 'content_manager' && !(hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_content_stats'))) {
    return { total: 0, drafts: 0, scheduled: 0, published: 0, upcomingEvents: 0, nextScheduled: [], nextEvents: [] }
  }
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const allowed = allowedContentTypes(staff)
  const canViewNews = allowed === 'all' || allowed.includes('news')
  const canViewEvents = allowed === 'all' || allowed.includes('event')

  let newsQuery = supabase.from('insights').select('id', { count: 'exact', head: true })
  let draftsQuery = supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'draft')
  let scheduledQuery = supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'scheduled')
  let publishedQuery = supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'published')
  if (allowed !== 'all') {
    const types = allowed.length > 0 ? allowed : ['__none__']
    newsQuery = newsQuery.in('content_type', types)
    draftsQuery = draftsQuery.in('content_type', types)
    scheduledQuery = scheduledQuery.in('content_type', types)
    publishedQuery = publishedQuery.in('content_type', types)
  }

  const [{ count: total }, { count: drafts }, { count: scheduled }, { count: published }, { data: upcomingEventsRaw }, { data: nextScheduledRaw }] =
    await Promise.all([
      newsQuery,
      draftsQuery,
      scheduledQuery,
      publishedQuery,
      canViewEvents
        ? supabase
            .from('insights')
            .select('id, title, event_start_at, event_venue')
            .eq('content_type', 'event')
            .eq('status', 'published')
            .gte('event_start_at', nowIso)
            .order('event_start_at', { ascending: true })
            .limit(5)
        : Promise.resolve({ data: [] as any[] }),
      canViewNews
        ? supabase
            .from('insights')
            .select('id, title, publish_at')
            .neq('content_type', 'event')
            .eq('status', 'scheduled')
            .order('publish_at', { ascending: true })
            .limit(5)
        : Promise.resolve({ data: [] as any[] })
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

export { insightPermissionModule }
