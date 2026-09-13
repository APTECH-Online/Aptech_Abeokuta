'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireCoursesAccess, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { uploadCourseImage, deleteCourseImageByUrl } from '../../../../lib/supabase/course-storage'
import { isCourseSlugTaken } from '../../../../lib/crm/courses'
import { slugify } from '../../../../lib/validation'
import type { CourseCategory, CourseStatus } from '../../../../types/db'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected courses error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateCoursePaths(slug?: string, oldSlug?: string) {
  revalidatePath('/admin/courses')
  revalidatePath('/admin')
  revalidatePath('/courses')
  revalidatePath('/')
  if (slug) revalidatePath(`/courses/${slug}`)
  if (oldSlug && oldSlug !== slug) revalidatePath(`/courses/${oldSlug}`)
}

const CATEGORIES: CourseCategory[] = ['advanced_diploma', 'smart_pro', 'acns', 'short_term']
const STATUSES: CourseStatus[] = ['draft', 'published', 'archived']

/** Splits a textarea's lines into a clean list, dropping blank lines. */
function linesToArray(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function validateFields(raw: {
  title: string
  category: string
  duration: string
  level: string
  mode: string
  summary: string
  description: string
  status: string
}) {
  const fieldErrors: Record<string, string> = {}
  if (!raw.title.trim()) fieldErrors.title = 'Title is required.'
  else if (raw.title.length > 200) fieldErrors.title = 'Keep the title under 200 characters.'
  if (!CATEGORIES.includes(raw.category as CourseCategory)) fieldErrors.category = 'Choose a category.'
  if (!raw.duration.trim()) fieldErrors.duration = 'Duration is required.'
  if (!raw.level.trim()) fieldErrors.level = 'Level is required.'
  if (!raw.mode.trim()) fieldErrors.mode = 'Mode is required.'
  if (!raw.summary.trim()) fieldErrors.summary = 'Summary is required.'
  if (!raw.description.trim()) fieldErrors.description = 'Description is required.'
  if (!STATUSES.includes(raw.status as CourseStatus)) fieldErrors.status = 'Choose a valid status.'
  return fieldErrors
}

function readCommon(formData: FormData) {
  return {
    title: String(formData.get('title') || '').trim(),
    slugInput: String(formData.get('slug') || '').trim(),
    category: String(formData.get('category') || ''),
    duration: String(formData.get('duration') || '').trim(),
    level: String(formData.get('level') || '').trim(),
    mode: String(formData.get('mode') || '').trim(),
    summary: String(formData.get('summary') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    highlights: linesToArray(String(formData.get('highlights') || '')),
    tools: linesToArray(String(formData.get('tools') || '')),
    outcomes: linesToArray(String(formData.get('outcomes') || '')),
    status: String(formData.get('status') || 'draft'),
    displayOrder: Number.isFinite(Number(formData.get('displayOrder'))) ? Math.trunc(Number(formData.get('displayOrder'))) : 0
  }
}

export async function createCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess()
    const raw = readCommon(formData)

    const fieldErrors = validateFields(raw)
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const slug = slugify(raw.slugInput || raw.title)
    if (!slug) return { ok: false, message: 'Could not generate a valid slug from that title.' }
    if (await isCourseSlugTaken(slug)) {
      return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use — try another' } }
    }

    const id = randomUUID()
    const admin = createAdminClient()

    let coverImageUrl: string | null = null
    const imageFile = formData.get('coverImage')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadCourseImage(imageFile, id)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { coverImage: result.error } }
      coverImageUrl = result.url
    }

    const { error } = await admin.from('courses').insert({
      id,
      title: raw.title,
      slug,
      category: raw.category as CourseCategory,
      duration: raw.duration,
      level: raw.level,
      mode: raw.mode,
      summary: raw.summary,
      description: raw.description,
      highlights: raw.highlights,
      tools: raw.tools,
      outcomes: raw.outcomes,
      cover_image: coverImageUrl,
      status: raw.status as CourseStatus,
      display_order: raw.displayOrder,
      created_by: staff.id
    })

    if (error) {
      console.error('[crm] failed to create course', error)
      if (error.code === '23505') return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use' } }
      return { ok: false, message: 'Could not create the course.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'course.created',
      entity: 'course',
      entityId: id,
      metadata: { title: raw.title, category: raw.category, status: raw.status }
    })

    revalidateCoursePaths(slug)
    return { ok: true, id }
  } catch (err) {
    return authError(err)
  }
}

export async function updateCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess()
    const courseId = String(formData.get('courseId') || '')
    if (!courseId) return { ok: false, message: 'Missing course.' }

    const raw = readCommon(formData)
    const fieldErrors = validateFields(raw)
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('courses').select('id, slug, cover_image').eq('id', courseId).maybeSingle()
    if (!existing) return { ok: false, message: 'This course no longer exists.' }

    const slug = slugify(raw.slugInput || raw.title)
    if (!slug) return { ok: false, message: 'Could not generate a valid slug from that title.' }
    if (slug !== existing.slug && (await isCourseSlugTaken(slug, courseId))) {
      return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use — try another' } }
    }

    let coverImageUrl: string | null | undefined = undefined // undefined = leave unchanged
    const removeImage = formData.get('removeImage') === 'on'
    const imageFile = formData.get('coverImage')
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadCourseImage(imageFile, courseId)
      if ('error' in result) return { ok: false, message: result.error, fieldErrors: { coverImage: result.error } }
      await deleteCourseImageByUrl(existing.cover_image)
      coverImageUrl = result.url
    } else if (removeImage) {
      await deleteCourseImageByUrl(existing.cover_image)
      coverImageUrl = null
    }

    const { error } = await admin
      .from('courses')
      .update({
        title: raw.title,
        slug,
        category: raw.category as CourseCategory,
        duration: raw.duration,
        level: raw.level,
        mode: raw.mode,
        summary: raw.summary,
        description: raw.description,
        highlights: raw.highlights,
        tools: raw.tools,
        outcomes: raw.outcomes,
        status: raw.status as CourseStatus,
        display_order: raw.displayOrder,
        ...(coverImageUrl !== undefined ? { cover_image: coverImageUrl } : {})
      })
      .eq('id', courseId)

    if (error) {
      console.error('[crm] failed to update course', error)
      if (error.code === '23505') return { ok: false, message: 'That slug is already in use.', fieldErrors: { slug: 'Already in use' } }
      return { ok: false, message: 'Could not save changes.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'course.updated',
      entity: 'course',
      entityId: courseId,
      metadata: { title: raw.title, status: raw.status }
    })

    revalidateCoursePaths(slug, existing.slug)
    return { ok: true, id: courseId }
  } catch (err) {
    return authError(err)
  }
}

async function transitionCourse(courseId: string, status: CourseStatus, action: string): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess()
    if (!courseId) return { ok: false, message: 'Missing course.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('courses').select('id, slug').eq('id', courseId).maybeSingle()
    if (!existing) return { ok: false, message: 'This course no longer exists.' }

    const { error } = await admin.from('courses').update({ status }).eq('id', courseId)
    if (error) return { ok: false, message: 'Could not update this course.' }

    await logAudit(admin, { userId: staff.id, action, entity: 'course', entityId: courseId })
    revalidateCoursePaths(existing.slug)
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function publishCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return transitionCourse(String(formData.get('courseId') || ''), 'published', 'course.published')
}

export async function archiveCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return transitionCourse(String(formData.get('courseId') || ''), 'archived', 'course.archived')
}

export async function restoreCourseToDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return transitionCourse(String(formData.get('courseId') || ''), 'draft', 'course.restored')
}

/**
 * Permanently removes a course. Like Insights, only draft/archived courses
 * can be deleted outright — a published course has a live public detail
 * page and may be linked from the admissions form's programme list, so it
 * must be archived first.
 */
export async function deleteCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess()
    const courseId = String(formData.get('courseId') || '')
    if (!courseId) return { ok: false, message: 'Missing course.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('courses')
      .select('id, title, slug, status, cover_image')
      .eq('id', courseId)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'This course no longer exists.' }

    if (existing.status !== 'draft' && existing.status !== 'archived') {
      return { ok: false, message: 'Archive this course before deleting it.' }
    }

    const { error } = await admin.from('courses').delete().eq('id', courseId)
    if (error) {
      console.error('[crm] failed to delete course', error)
      return { ok: false, message: 'Could not delete this course.' }
    }

    await deleteCourseImageByUrl(existing.cover_image)

    await logAudit(admin, {
      userId: staff.id,
      action: 'course.deleted',
      entity: 'course',
      entityId: courseId,
      metadata: { title: existing.title, slug: existing.slug }
    })

    revalidateCoursePaths(existing.slug)
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
