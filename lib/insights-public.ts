import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { Insight, InsightContentType } from '../types/db'
import { INSIGHT_TOPICS, pickRelated } from './topics'

/**
 * The `insights` table is staff-only under RLS (see migration 0004,
 * mirroring how `programmes` works — see app/(site)/admissions/programmes.ts
 * for the established pattern this file follows). These functions run
 * entirely on the server, use the service-role client, and return only the
 * public-safe fields the site needs — never author internals, audit data,
 * or the service-role key itself reach the browser.
 *
 * Every query here filters at the database level for status = 'published'
 * AND (expires_at is null OR expires_at > now()), so drafts, scheduled and
 * expired/archived content can never leak onto a public page even if a
 * component forgets to double-check.
 */

const PUBLIC_FIELDS =
  'id, title, slug, short_description, content, featured_image, category, content_type, ' +
  'is_featured, publish_at, seo_title, seo_description, seo_noindex, ' +
  'event_start_at, event_end_at, event_venue, event_registration_url, event_contact, ' +
  'created_at, updated_at'
// Same list minus the column added by migration 0018_seo_fields.sql — used as a
// fallback so the public site keeps working if code deploys before the migration.
const LEGACY_FIELDS = PUBLIC_FIELDS.replace(' seo_noindex,', '')

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === '42703' || /seo_noindex/.test(error.message ?? ''))
}

export type PublicInsight = Omit<Insight, 'author_id' | 'status' | 'expires_at' | 'featured_priority'>

/**
 * Content types that are grouped together as "Blog / Insights" on the
 * public site (/insights/blog). News, announcements and events each get
 * their own dedicated section, so they're excluded here — see
 * components/insights/badge.ts, which uses this same list to badge cards.
 */
export const BLOG_CONTENT_TYPES: InsightContentType[] = [
  'academic_update',
  'spotlight',
  'achievement',
  'career_update',
  'celebration'
]

/** Runs a public query with the SEO column; retries without it if migration 0018 isn't applied yet. */
async function runPublic(build: (fields: string) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>) {
  const first = await build(PUBLIC_FIELDS)
  return isMissingColumn(first.error) ? build(LEGACY_FIELDS) : first
}

function publicQuery(fields: string = PUBLIC_FIELDS) {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  return admin
    .from('insights')
    .select(fields)
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .lte('publish_at', nowIso)
}

export async function getPublishedInsights(
  opts: { category?: string; contentTypes?: InsightContentType[]; limit?: number } = {}
): Promise<PublicInsight[]> {
  try {
    const build = (fields: string) => {
      let query = publicQuery(fields).order('publish_at', { ascending: false })
      if (opts.category) query = query.eq('category', opts.category)
      if (opts.contentTypes && opts.contentTypes.length > 0) query = query.in('content_type', opts.contentTypes)
      if (opts.limit) query = query.limit(opts.limit)
      return query
    }
    const { data, error } = await runPublic(build)
    if (error) {
      console.error('[insights] failed to load published insights', error)
      return []
    }
    return (data ?? []) as unknown as PublicInsight[]
  } catch (err) {
    console.error('[insights] published insights unavailable', err)
    return []
  }
}

export async function getInsightBySlug(slug: string): Promise<PublicInsight | null> {
  try {
    const { data, error } = await runPublic((f) => publicQuery(f).eq('slug', slug).maybeSingle())
    if (error || !data) return null
    return data as unknown as PublicInsight
  } catch (err) {
    console.error('[insights] insight lookup unavailable', err)
    return null
  }
}

/**
 * Published, indexable insights by slug, returned in the order requested.
 * Used for hand-picked topical links (course -> guides, guide -> guides).
 * A slug that is unpublished, expired, renamed or flagged noindex is simply
 * absent from the result, so a topical link can never point at a 404 or at a
 * page deliberately kept out of search.
 */
export async function getInsightsBySlugs(slugs: string[]): Promise<PublicInsight[]> {
  if (slugs.length === 0) return []
  try {
    const { data, error } = await runPublic((f) => publicQuery(f).in('slug', slugs))
    if (error) return []
    const rows = ((data ?? []) as unknown as PublicInsight[]).filter((r) => !r.seo_noindex)
    const bySlug = new Map(rows.map((r) => [r.slug, r]))
    return slugs.map((s) => bySlug.get(s)).filter((r): r is PublicInsight => Boolean(r))
  } catch {
    return []
  }
}

/**
 * Related insights: hand-picked topical matches first (lib/topics.ts), then
 * the most recent items from the same category. The category-only behaviour
 * this replaces linked the two "Student Guides" to each other and left the
 * other four guides with no related insight at all.
 */
export async function getRelatedInsights(post: PublicInsight, limit = 3): Promise<PublicInsight[]> {
  try {
    const picked = INSIGHT_TOPICS[post.slug]?.relatedInsights ?? []
    const [topical, sameCategory] = await Promise.all([
      getInsightsBySlugs(picked),
      runPublic((f) =>
        publicQuery(f)
          .eq('category', post.category)
          .neq('slug', post.slug)
          .order('publish_at', { ascending: false })
          .limit(limit)
      ).then((r) => (r.error ? [] : ((r.data ?? []) as unknown as PublicInsight[]).filter((x) => !x.seo_noindex)))
    ])
    return pickRelated([...topical, ...sameCategory.filter((x) => !topical.some((t) => t.slug === x.slug))], picked, limit, () => true)
      .filter((x) => x.slug !== post.slug)
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function getFeaturedInsights(limit = 3): Promise<PublicInsight[]> {
  try {
    const { data, error } = await runPublic((f) =>
      publicQuery(f)
        .eq('is_featured', true)
        .order('featured_priority', { ascending: true })
        .order('publish_at', { ascending: false })
        .limit(limit)
    )
    if (error) return []
    return (data ?? []) as unknown as PublicInsight[]
  } catch {
    return []
  }
}

/**
 * Upcoming events: published, content_type = 'event', and the event hasn't
 * finished yet (falls back to event_start_at when there's no end date) —
 * this is what automatically drops past events from the public listing
 * without any manual archiving step.
 */
export async function getUpcomingEvents(limit = 6): Promise<PublicInsight[]> {
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await runPublic((f) =>
      publicQuery(f)
        .eq('content_type', 'event')
        .or(`event_end_at.gte.${nowIso},and(event_end_at.is.null,event_start_at.gte.${nowIso})`)
        .order('event_start_at', { ascending: true })
        .limit(limit)
    )
    if (error) {
      console.error('[insights] failed to load upcoming events', error)
      return []
    }
    return (data ?? []) as unknown as PublicInsight[]
  } catch (err) {
    console.error('[insights] upcoming events unavailable', err)
    return []
  }
}

/**
 * Past/completed events, newest-first — used for the events archive on
 * /insights/events. Published events whose end (or start, when there's no
 * end date) has already passed.
 */
export async function getPastEvents(limit = 12): Promise<PublicInsight[]> {
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await runPublic((f) =>
      publicQuery(f)
        .eq('content_type', 'event')
        .or(`event_end_at.lt.${nowIso},and(event_end_at.is.null,event_start_at.lt.${nowIso})`)
        .order('event_start_at', { ascending: false })
        .limit(limit)
    )
    if (error) {
      console.error('[insights] failed to load past events', error)
      return []
    }
    return (data ?? []) as unknown as PublicInsight[]
  } catch (err) {
    console.error('[insights] past events unavailable', err)
    return []
  }
}

export async function getInsightCategories(contentTypes?: InsightContentType[]): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()
    let query = admin
      .from('insights')
      .select('category')
      .eq('status', 'published')
      .lte('publish_at', nowIso)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    if (contentTypes && contentTypes.length > 0) query = query.in('content_type', contentTypes)
    const { data, error } = await query
    if (error || !data) return []
    const set = new Set<string>((data as any[]).map((d) => d.category).filter(Boolean))
    return Array.from(set).sort()
  } catch {
    return []
  }
}

/**
 * Everything the homepage "Latest News & Updates" section needs, in one
 * call: a single featured story, a few supporting stories, and any
 * upcoming events. Falls back gracefully at every step so the section
 * degrades cleanly instead of breaking when there's little content yet.
 */
export async function getHomepageUpdates(): Promise<{
  featured: PublicInsight | null
  supporting: PublicInsight[]
  upcomingEvents: PublicInsight[]
}> {
  try {
    const [featuredList, recent, upcomingEvents] = await Promise.all([
      getFeaturedInsights(1),
      getPublishedInsights({ limit: 7 }),
      getUpcomingEvents(4)
    ])

    // Prefer the CRM's is_featured flag; fall back to the most recent
    // published item (excluding events, which get their own panel) so the
    // section still has a lead story even with no featured flag set.
    const featured =
      featuredList[0] ?? recent.find((p) => p.content_type !== 'event') ?? recent[0] ?? null

    const supporting = recent
      .filter((p) => p.slug !== featured?.slug)
      .filter((p) => p.content_type !== 'event')
      .slice(0, 3)

    return { featured, supporting, upcomingEvents }
  } catch (err) {
    console.error('[insights] homepage updates unavailable', err)
    return { featured: null, supporting: [], upcomingEvents: [] }
  }
}

/**
 * Lightweight list for the sitemap: every published, non-expired, non-noindex
 * insight (including events) with just the fields needed to build its URL and
 * lastmod — no article bodies.
 */
export async function getSitemapInsights(): Promise<{ slug: string; contentType: InsightContentType; updatedAt: string }[]> {
  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()
    const run = (fields: string) =>
      admin
        .from('insights')
        .select(fields)
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .lte('publish_at', nowIso)
        .order('publish_at', { ascending: false })
    let { data, error } = await run('slug, content_type, updated_at, seo_noindex')
    if (isMissingColumn(error)) ({ data, error } = await run('slug, content_type, updated_at'))
    if (error) return []
    return ((data ?? []) as unknown as { slug: string; content_type: InsightContentType; updated_at: string; seo_noindex?: boolean }[])
      .filter((r) => !r.seo_noindex)
      .map((r) => ({ slug: r.slug, contentType: r.content_type, updatedAt: r.updated_at }))
  } catch (err) {
    console.error('[insights] sitemap insights unavailable', err)
    return []
  }
}

/**
 * Existence-only check for a published, in-window insight slug, used by
 * proxy.ts to decide — before any page rendering/streaming starts — whether
 * a request for /insights/:slug should be allowed through, redirected, or
 * answered with a real 404. Mirrors publicQuery()'s publish-window filter
 * without selecting any article content.
 */
export async function publishedInsightSlugExists(slug: string): Promise<boolean> {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await admin
    .from('insights')
    .select('slug')
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .lte('publish_at', nowIso)
    .eq('slug', slug)
    .limit(1)
  if (error) throw error
  return !!data && data.length > 0
}
