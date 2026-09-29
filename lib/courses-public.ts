import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { Course as DbCourse, CourseCategory } from '../types/db'
import { COURSE_CATEGORY_LABELS } from '../types/db'
import type { Course } from '../data/courses'

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

type Row = Pick<
  DbCourse,
  'title' | 'slug' | 'category' | 'duration' | 'level' | 'mode' | 'summary' | 'description' | 'highlights' | 'tools' | 'outcomes' | 'cover_image'
> &
  Partial<Pick<DbCourse, 'seo_title' | 'seo_description' | 'seo_noindex' | 'updated_at'>>

type QueryResult = { data: unknown; error: { code?: string; message?: string } | null }

/** Runs a query with the SEO columns; on "undefined column" retries without them. */
async function withSeoFallback(run: (fields: string) => PromiseLike<QueryResult>): Promise<QueryResult> {
  const result = await run(PUBLIC_FIELDS)
  if (result.error && (result.error.code === '42703' || /seo_|updated_at/.test(result.error.message ?? ''))) {
    return run(BASE_FIELDS)
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

export function getRelatedCourses(all: Course[], course: Course, limit = 3): Course[] {
  return all.filter((c) => c.slug !== course.slug).slice(0, limit)
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
