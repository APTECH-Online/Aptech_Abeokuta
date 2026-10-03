import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { Course as DbCourse, CourseCategory } from '../types/db'
import { COURSE_CATEGORY_LABELS } from '../types/db'
import type { Course } from '../data/courses'
import { COURSE_TOPICS, courseH1, pickRelated } from './topics'

/**
 * `courses` is staff-only under RLS (see migration 0007, same model as
 * lib/insights-public.ts / lib/gallery-public.ts). Runs entirely on the
 * server, uses the service-role client, and returns only the public-safe
 * fields — never created_by, status or the service-role key reach the
 * browser. Always filters at the database level for status = 'published'.
 *
 * The returned shape deliberately matches the OLD static `Course` type from
 * data/courses.ts (display-label category string, `coverImage`, no id/
 * status/timestamps) rather than the raw DB row shape, so every existing
 * consumer (CourseCard, CourseSearch, ProgramFinder, CareerPaths, ...) keeps
 * working unchanged — only the handful of page-level components that used
 * to `import { courses } from '../../data/courses'` need to switch to
 * calling getPublishedCourses()/getPublishedCourseBySlug() instead.
 */

const BASE_FIELDS = 'title, slug, category, duration, level, mode, summary, description, highlights, tools, outcomes, cover_image'
// Added by migration 0018_seo_fields.sql. Selected separately so that, if this
// code is ever deployed before the migration has run, the public site falls
// back to the base columns instead of losing every course.
const SEO_FIELDS = 'seo_title, seo_description, seo_noindex, updated_at'
const PUBLIC_FIELDS = `${BASE_FIELDS}, ${SEO_FIELDS}`
// Added by migration 0022_course_detail_fields.sql; same fallback rule as above.
const DETAIL_FIELDS = 'audience, prerequisites, certification'
const DETAIL_TIER = `${PUBLIC_FIELDS}, ${DETAIL_FIELDS}`
// Added by migration 0023_course_crm_controls.sql; same fallback rule as above.
const CONTROL_FIELDS = 'admission_status, intake_note, page_heading, related_courses, related_insights, curriculum, featured_home'
const FULL_FIELDS = `${DETAIL_TIER}, ${CONTROL_FIELDS}`

type Row = Pick<
  DbCourse,
  'title' | 'slug' | 'category' | 'duration' | 'level' | 'mode' | 'summary' | 'description' | 'highlights' | 'tools' | 'outcomes' | 'cover_image'
> &
  Partial<Pick<DbCourse, 'seo_title' | 'seo_description' | 'seo_noindex' | 'updated_at' | 'audience' | 'prerequisites' | 'certification' | 'admission_status' | 'intake_note' | 'page_heading' | 'related_courses' | 'related_insights' | 'curriculum' | 'featured_home'>>

type QueryResult = { data: unknown; error: { code?: string; message?: string } | null }

/**
 * Runs a query with every column and, on "undefined column", steps down through
 * the older column sets (pre-0023, pre-0022, pre-0018), so a deploy that runs
 * ahead of a migration degrades gracefully instead of losing every course.
 */
async function withSeoFallback(run: (fields: string) => PromiseLike<QueryResult>): Promise<QueryResult> {
  const isMissingColumn = (r: QueryResult) =>
    !!r.error &&
    (r.error.code === '42703' ||
      /audience|prerequisites|certification|admission_status|intake_note|page_heading|related_|curriculum|featured_home|seo_|updated_at/.test(r.error.message ?? ''))
  let result: QueryResult = { data: null, error: null }
  for (const fields of [FULL_FIELDS, DETAIL_TIER, PUBLIC_FIELDS, BASE_FIELDS]) {
    result = await run(fields)
    if (!isMissingColumn(result)) break
  }
  return result
}

function toPublicCourse(row: Row): Course {
  return {
    slug: row.slug,
    title: row.title,
    category: COURSE_CATEGORY_LABELS[row.category as CourseCategory] as Course['category'],
    duration: row.duration,
    level: row.level,
    mode: row.mode,
    summary: row.summary,
    description: row.description,
    highlights: row.highlights,
    tools: row.tools,
    outcomes: row.outcomes,
    coverImage: row.cover_image ?? undefined,
    audience: row.audience?.trim() || undefined,
    prerequisites: row.prerequisites?.trim() || undefined,
    certification: row.certification?.trim() || undefined,
    admissionStatus: row.admission_status ?? 'open',
    intakeNote: row.intake_note?.trim() || undefined,
    pageHeading: row.page_heading?.trim() || undefined,
    relatedCourses: row.related_courses ?? [],
    relatedInsights: row.related_insights ?? [],
    curriculum: row.curriculum?.trim() || undefined,
    featuredHome: row.featured_home ?? false,
    controlsLoaded: row.admission_status !== undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    noindex: row.seo_noindex ?? false,
    updatedAt: row.updated_at ?? undefined
  }
}

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await withSeoFallback((fields) =>
      admin
        .from('courses')
        .select(fields)
        .eq('status', 'published')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })
    )

    if (error) {
      console.error('[courses] failed to load published courses', error)
      return []
    }
    return ((data ?? []) as unknown as Row[]).map(toPublicCourse)
  } catch (err) {
    console.error('[courses] unexpected error loading published courses', err)
    return []
  }
}

export async function getPublishedCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await withSeoFallback((fields) =>
      admin.from('courses').select(fields).eq('status', 'published').eq('slug', slug).maybeSingle()
    )

    if (error || !data) return null
    return toPublicCourse(data as unknown as Row)
  } catch (err) {
    console.error('[courses] unexpected error loading course by slug', err)
    return null
  }
}

/**
 * Hand-picked, topically related courses first (see lib/topics.ts), then the
 * same programme category, then anything else. Previously this returned the
 * first three other courses in database order, so every page linked to the
 * same three programmes and the short courses received almost no
 * contextual links from sibling pages.
 */
export function getRelatedCourses(all: Course[], course: Course, limit = 3): Course[] {
  const others = all.filter((c) => c.slug !== course.slug)
  // CRM-chosen list when migration 0023 is in place; the in-code map only
  // before it. An empty CRM list means "automatic": same category, then any.
  const picked = course.controlsLoaded ? course.relatedCourses : COURSE_TOPICS[course.slug]?.relatedCourses ?? []
  const sameCategory = pickRelated(others, picked, limit, (c) => c.category === course.category)
  return sameCategory.length >= limit ? sameCategory : pickRelated(others, picked, limit, () => true)
}

/** The H1: CRM page heading, else (pre-0023 only) the in-code heading, else the title. */
export function getCourseHeading(course: Course): string {
  if (course.pageHeading) return course.pageHeading
  return course.controlsLoaded ? course.title : courseH1(course.slug, course.title)
}

/**
 * Lightweight list for the sitemap: only the fields needed to build a URL,
 * without pulling every course's full description. Excludes courses staff
 * have marked noindex so they never appear in the sitemap.
 */
export async function getSitemapCourses(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const admin = createAdminClient()
    const result = await admin
      .from('courses')
      .select('slug, updated_at, seo_noindex')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
    let rows = result.data as { slug: string; updated_at?: string; seo_noindex?: boolean }[] | null
    if (result.error) {
      // Migration 0018 not applied yet: fall back to slug only.
      const fallback = await admin.from('courses').select('slug').eq('status', 'published').order('display_order', { ascending: true })
      if (fallback.error) return []
      rows = fallback.data as { slug: string }[]
    }
    return (rows ?? []).filter((r) => !r.seo_noindex).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }))
  } catch (err) {
    console.error('[courses] sitemap courses unavailable', err)
    return []
  }
}

/**
 * Existence-only check for a published course slug, used by proxy.ts to
 * decide — before any page rendering/streaming starts — whether a request
 * for /courses/:slug should be allowed through, redirected, or answered
 * with a real 404. Deliberately the smallest possible query (one column,
 * limit 1): proxy runs on every matching request, so this must stay cheap.
 */
export async function publishedCourseSlugExists(slug: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('courses').select('slug').eq('status', 'published').eq('slug', slug).limit(1)
  if (error) throw error
  return !!data && data.length > 0
}
