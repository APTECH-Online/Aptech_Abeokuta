'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireCoursesAccess, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { uploadCourseImage, deleteCourseImageByUrl } from '../../../../lib/supabase/course-storage'
import { isCourseSlugTaken } from '../../../../lib/crm/courses'
import { slugify } from '../../../../lib/validation'
import { recordSlugChange } from '../../../../lib/seo-redirects'
import { parseCurriculum } from '../../../../lib/curriculum'
import type { AdmissionStatus } from '../../../../types/db'
import { resolveSeoFields } from '../../../../lib/seo'
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
  revalidatePath('/sitemap.xml') // keep the sitemap in step with publish/unpublish/rename
  revalidatePath('/')
  if (slug) revalidatePath(`/courses/${slug}`)
  if (oldSlug && oldSlug !== slug) revalidatePath(`/courses/${oldSlug}`)
}

const CATEGORIES: CourseCategory[] = ['advanced_diploma', 'smart_pro', 'acns', 'short_term']
const STATUSES: CourseStatus[] = ['draft', 'published', 'archived']
const ADMISSION_STATUSES: AdmissionStatus[] = ['open', 'coming_soon', 'closed']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Checkbox values -> unique, well-formed slugs (max 12). Unknown slugs are harmless: the public site ignores any that are not published. */
function cleanSlugList(values: FormDataEntryValue[]): string[] {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter((v) => SLUG_RE.test(v)))).slice(0, 12)
}

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
  seoTitle: string
  seoDescription: string
  controlsAvailable?: boolean
  admissionStatus?: string
  intakeNote?: string
  pageHeading?: string
  curriculum?: string
}) {
  const fieldErrors: Record<string, string> = {}
  if (raw.seoTitle.length > 70) fieldErrors.seoTitle = 'Keep the SEO title under 70 characters.'
  if (raw.seoDescription.length > 160) fieldErrors.seoDescription = 'Keep the meta description under 160 characters.'
  if (!raw.title.trim()) fieldErrors.title = 'Title is required.'
  else if (raw.title.length > 200) fieldErrors.title = 'Keep the title under 200 characters.'
  if (!CATEGORIES.includes(raw.category as CourseCategory)) fieldErrors.category = 'Choose a category.'
  if (!raw.duration.trim()) fieldErrors.duration = 'Duration is required.'
  if (!raw.level.trim()) fieldErrors.level = 'Level is required.'
  if (!raw.mode.trim()) fieldErrors.mode = 'Mode is required.'
  if (!raw.summary.trim()) fieldErrors.summary = 'Summary is required.'
  if (!raw.description.trim()) fieldErrors.description = 'Description is required.'
  if (!STATUSES.includes(raw.status as CourseStatus)) fieldErrors.status = 'Choose a valid status.'
  if (raw.controlsAvailable) {
    if (!ADMISSION_STATUSES.includes((raw.admissionStatus ?? 'open') as AdmissionStatus)) fieldErrors.admissionStatus = 'Choose a valid admission status.'
    if ((raw.intakeNote ?? '').length > 200) fieldErrors.intakeNote = 'Keep the intake note under 200 characters.'
    if ((raw.pageHeading ?? '').length > 120) fieldErrors.pageHeading = 'Keep the page heading under 120 characters.'
    const { errors } = parseCurriculum(raw.curriculum)
    if ((raw.curriculum ?? '').length > 20000) fieldErrors.curriculum = 'The curriculum is too long (20,000 characters maximum).'
    else if (errors.length > 0) {
      const shown = errors.slice(0, 3).map((e) => (e.line ? `Line ${e.line}: ${e.message}` : e.message)).join(' ')
      fieldErrors.curriculum = errors.length > 3 ? `${shown} (+${errors.length - 3} more)` : shown
    }
  }
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
    audience: String(formData.get('audience') || '').trim(),
    prerequisites: String(formData.get('prerequisites') || '').trim(),
    certification: String(formData.get('certification') || '').trim(),
    hadDetails: formData.get('hadDetails') === '1',
    controlsAvailable: formData.get('controlsAvailable') === '1',
    admissionStatus: String(formData.get('admissionStatus') || 'open'),
    intakeNote: String(formData.get('intakeNote') || '').trim(),
    pageHeading: String(formData.get('pageHeading') || '').trim(),
    curriculum: String(formData.get('curriculum') || '').replace(/\r\n/g, '\n').trim(),
    featuredHome: formData.get('featuredHome') === 'on',
    relatedCourses: cleanSlugList(formData.getAll('relatedCourses')),
    relatedInsights: cleanSlugList(formData.getAll('relatedInsights')),
    status: String(formData.get('status') || 'draft'),
    seoTitle: String(formData.get('seoTitle') || '').trim(),
    seoDescription: String(formData.get('seoDescription') || '').trim(),
    seoNoindex: formData.get('seoNoindex') === 'on',
    displayOrder: Number.isFinite(Number(formData.get('displayOrder'))) ? Math.trunc(Number(formData.get('displayOrder'))) : 0
  }
}

/**
 * Optional detail columns (migration 0022). Sent only when staff entered
 * something, or when the course already had values (so they can be cleared).
 * That keeps saves working on a database where 0022 has not been applied yet.
 */
function detailColumns(raw: ReturnType<typeof readCommon>) {
  const any = raw.audience || raw.prerequisites || raw.certification
  if (!any && !raw.hadDetails) return {}
  return {
    audience: raw.audience || null,
    prerequisites: raw.prerequisites || null,
    certification: raw.certification || null
  }
}

/**
 * CRM page controls (migration 0023). Written only when the form says the
 * columns exist, so saving still works on a database that is not migrated yet.
 */
function controlColumns(raw: ReturnType<typeof readCommon>, ownSlug: string) {
  if (!raw.controlsAvailable) return {}
  return {
    admission_status: raw.admissionStatus as AdmissionStatus,
    intake_note: raw.intakeNote || null,
    page_heading: raw.pageHeading || null,
    related_courses: raw.relatedCourses.filter((s) => s !== ownSlug),
    related_insights: raw.relatedInsights,
    curriculum: raw.curriculum || null,
    featured_home: raw.featuredHome
  }
}

export async function createCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess('create')
    const raw = readCommon(formData)

    const fieldErrors = validateFields(raw)
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    // Never save a course without a SEO title + meta description: anything the
    // editor leaves blank is generated from the course's own title/summary.
    const seo = resolveSeoFields('course', { title: raw.title, summary: raw.summary }, raw)
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
      ...detailColumns(raw),
      ...controlColumns(raw, slug),
      cover_image: coverImageUrl,
      status: raw.status as CourseStatus,
      display_order: raw.displayOrder,
      seo_title: seo.seo_title,
      seo_description: seo.seo_description,
      seo_noindex: raw.seoNoindex,
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
    const staff = await requireCoursesAccess('edit')
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

    // Never save a course without a SEO title + meta description: anything the
    // editor leaves blank is generated from the course's own title/summary.
    const seo = resolveSeoFields('course', { title: raw.title, summary: raw.summary }, raw)
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
        ...detailColumns(raw),
        ...controlColumns(raw, slug),
        status: raw.status as CourseStatus,
        display_order: raw.displayOrder,
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        seo_noindex: raw.seoNoindex,
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

    // Renamed slug → keep the old URL alive with a permanent redirect.
    if (slug !== existing.slug) {
      await recordSlugChange(admin, '/courses', existing.slug, slug)
      // Keep other courses' "Related courses" lists pointing at the renamed course.
      if (raw.controlsAvailable) await renameInRelatedCourses(admin, existing.slug, slug)
    }

    revalidateCoursePaths(slug, existing.slug)
    return { ok: true, id: courseId }
  } catch (err) {
    return authError(err)
  }
}

/** Best-effort: a failure here only means a stale slug, which the public site ignores. */
async function renameInRelatedCourses(admin: ReturnType<typeof createAdminClient>, oldSlug: string, newSlug: string) {
  try {
    const { data } = await admin.from('courses').select('id, related_courses').contains('related_courses', [oldSlug])
    for (const row of (data ?? []) as { id: string; related_courses: string[] }[]) {
      await admin.from('courses').update({ related_courses: row.related_courses.map((s) => (s === oldSlug ? newSlug : s)) }).eq('id', row.id)
    }
  } catch (err) {
    console.error('[crm] could not update related_courses after slug rename', err)
  }
}

async function transitionCourse(courseId: string, status: CourseStatus, action: string, permissionAction: 'publish' | 'unpublish' | 'edit'): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess(permissionAction)
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
  return transitionCourse(String(formData.get('courseId') || ''), 'published', 'course.published', 'publish')
}

export async function archiveCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return transitionCourse(String(formData.get('courseId') || ''), 'archived', 'course.archived', 'unpublish')
}

export async function restoreCourseToDraft(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return transitionCourse(String(formData.get('courseId') || ''), 'draft', 'course.restored', 'edit')
}

/**
 * Permanently removes a course. Like Insights, only draft/archived courses
 * can be deleted outright — a published course has a live public detail
 * page and may be linked from the admissions form's programme list, so it
 * must be archived first.
 */
export async function deleteCourse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireCoursesAccess('delete')
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
