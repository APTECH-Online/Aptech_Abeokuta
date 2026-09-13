import 'server-only'
import { createAdminClient } from './admin'
import { validateImageFile } from '../validation'

const BUCKET = 'testimonials'

export async function uploadTestimonialImage(
  file: File,
  itemId: string
): Promise<{ url: string } | { error: string }> {
  const validationError = validateImageFile(file)
  if (validationError) return { error: validationError }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${itemId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false
  })

  if (error) {
    console.error('[testimonials] image upload failed', error)
    return { error: 'Could not upload the photo. Please try again.' }
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

/** Best-effort delete — skips seeded rows pointing at /public files, same as gallery-storage.ts. */
export async function deleteTestimonialImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    const admin = createAdminClient()
    await admin.storage.from(BUCKET).remove([path])
  } catch (err) {
    console.error('[testimonials] failed to delete old image', err)
  }
}
