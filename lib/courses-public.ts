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

const PUBLIC_FIELDS = 'title, slug, category, duration, level, mode, summary, description, highlights, tools, outcomes, cover_image'

type Row = Pick<
  DbCourse,
  'title' | 'slug' | 'category' | 'duration' | 'level' | 'mode' | 'summary' | 'description' | 'highlights' | 'tools' | 'outcomes' | 'cover_image'
>

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
    coverImage: row.cover_image ?? undefined
  }
}

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('courses')
      .select(PUBLIC_FIELDS)
      .eq('status', 'published')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })

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
    const { data, error } = await admin
      .from('courses')
      .select(PUBLIC_FIELDS)
      .eq('status', 'published')
      .eq('slug', slug)
      .maybeSingle()

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
