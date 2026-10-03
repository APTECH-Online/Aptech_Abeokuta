// This file used to hold the entire course catalogue as a hardcoded array.
// That content now lives in the `courses` table (see migration
// 0007_courses.sql), managed via the CRM at /admin/courses, and is fetched
// through lib/courses-public.ts (getPublishedCourses / getPublishedCourseBySlug).
//
// The `Course` type and `categories` list stay here because they're the
// shared, structural shape every display component (CourseCard,
// CourseSearch, ProgramFinder, CareerPaths, StatsBand, ...) is written
// against — lib/courses-public.ts maps database rows into this exact shape
// so none of those components needed to change.

export type Course = {
  slug: string
  title: string
  category: 'Advanced Diploma' | 'Smart Pro' | 'Aptech Certified Network Specialist' | 'Short Term Courses'
  duration: string
  level: string
  mode: string
  summary: string
  description: string
  highlights: string[]
  tools: string[]
  outcomes: string[]
  coverImage?: string
  // Optional staff-written detail (migration 0022). Sections render only when present.
  audience?: string
  prerequisites?: string
  certification?: string
  // CRM page controls (migration 0023_course_crm_controls.sql).
  admissionStatus: 'open' | 'coming_soon' | 'closed'
  intakeNote?: string
  pageHeading?: string
  relatedCourses: string[]
  relatedInsights: string[]
  curriculum?: string
  featuredHome: boolean
  /** False only when the database has not had migration 0023 applied yet. */
  controlsLoaded: boolean
  // SEO fields managed in the CRM (see migration 0018_seo_fields.sql). All optional:
  // pages fall back to generated values when they are blank.
  seoTitle?: string
  seoDescription?: string
  noindex?: boolean
  updatedAt?: string
}

export const categories = [
  'Advanced Diploma',
  'Smart Pro',
  'Aptech Certified Network Specialist',
  'Short Term Courses'
] as const
