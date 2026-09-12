import 'server-only'
import { createAdminClient } from './admin'
import { validateImageFile } from '../validation'

const BUCKET = 'insights'

/**
 * Uploads a featured image for an insight and returns its public URL.
 * Always goes through the service-role client — see migration
 * 0004_insights.sql for why the bucket itself has no client-writable
 * policies. Returns an error string instead of throwing so callers can
 * surface it as a normal form field error.
 */
export async function uploadInsightImage(
  file: File,
  insightId: string
): Promise<{ url: string } | { error: string }> {
  const validationError = validateImageFile(file)
  if (validationError) return { error: validationError }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${insightId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false
  })

  if (error) {
    console.error('[insights] image upload failed', error)
    return { error: 'Could not upload the image. Please try again.' }
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

/** Best-effort delete — failures here shouldn't block the calling action. */
export async function deleteInsightImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    const admin = createAdminClient()
    await admin.storage.from(BUCKET).remove([path])
  } catch (err) {
    console.error('[insights] failed to delete old image', err)
  }
}
