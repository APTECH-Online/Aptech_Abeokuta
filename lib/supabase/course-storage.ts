import 'server-only'
import { createAdminClient } from './admin'
import { validateImageFile } from '../validation'

const BUCKET = 'courses'

/**
 * Uploads a course cover image and returns its public URL. Same pattern as
 * lib/supabase/insights-storage.ts and gallery-storage.ts — always via the
 * service-role client, error returned rather than thrown.
 */
export async function uploadCourseImage(
  file: File,
  courseId: string
): Promise<{ url: string } | { error: string }> {
  const validationError = validateImageFile(file)
  if (validationError) return { error: validationError }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${courseId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false
  })

  if (error) {
    console.error('[courses] image upload failed', error)
    return { error: 'Could not upload the image. Please try again.' }
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

/** Best-effort delete — failures here shouldn't block the calling action. */
export async function deleteCourseImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    const admin = createAdminClient()
    await admin.storage.from(BUCKET).remove([path])
  } catch (err) {
    console.error('[courses] failed to delete old image', err)
  }
}
