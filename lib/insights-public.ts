import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { Insight } from '../types/db'

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
  'is_featured, publish_at, seo_title, seo_description, ' +
  'event_start_at, event_end_at, event_venue, event_registration_url, event_contact, ' +
  'created_at, updated_at'

export type PublicInsight = Omit<Insight, 'author_id' | 'status' | 'expires_at' | 'featured_priority'>

function publicQuery() {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  return admin
    .from('insights')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .lte('publish_at', nowIso)
}

export async function getPublishedInsights(opts: { category?: string; limit?: number } = {}): Promise<PublicInsight[]> {
  try {
    let query = publicQuery().order('publish_at', { ascending: false })
    if (opts.category) query = query.eq('category', opts.category)
    if (opts.limit) query = query.limit(opts.limit)
    const { data, error } = await query
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
    const { data, error } = await publicQuery().eq('slug', slug).maybeSingle()
    if (error || !data) return null
    return data as unknown as PublicInsight
  } catch (err) {
    console.error('[insights] insight lookup unavailable', err)
    return null
  }
}

export async function getRelatedInsights(post: PublicInsight, limit = 3): Promise<PublicInsight[]> {
  try {
    const { data, error } = await publicQuery()
      .eq('category', post.category)
      .neq('slug', post.slug)
      .order('publish_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data ?? []) as unknown as PublicInsight[]
  } catch {
    return []
  }
}

export async function getFeaturedInsights(limit = 3): Promise<PublicInsight[]> {
  try {
    const { data, error } = await publicQuery()
      .eq('is_featured', true)
      .order('featured_priority', { ascending: true })
      .order('publish_at', { ascending: false })
      .limit(limit)
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
    const { data, error } = await publicQuery()
      .eq('content_type', 'event')
      .or(`event_end_at.gte.${nowIso},and(event_end_at.is.null,event_start_at.gte.${nowIso})`)
      .order('event_start_at', { ascending: true })
      .limit(limit)
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

export async function getInsightCategories(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()
    const { data, error } = await admin
      .from('insights')
      .select('category')
      .eq('status', 'published')
      .lte('publish_at', nowIso)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    if (error || !data) return []
    const set = new Set<string>((data as any[]).map((d) => d.category).filter(Boolean))
    return Array.from(set).sort()
  } catch {
    return []
  }
}
