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
}

export const categories = [
  'Advanced Diploma',
  'Smart Pro',
  'Aptech Certified Network Specialist',
  'Short Term Courses'
] as const
