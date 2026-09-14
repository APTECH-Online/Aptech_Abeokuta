import 'server-only'
import { createAdminClient } from './admin'
import { validateImageFile } from '../validation'

const BUCKET = 'partner-logos'

/**
 * Uploads an affiliated-university logo and returns its public URL. Always
 * goes through the service-role client — see migration
 * 0011_partners_and_affiliated_universities.sql for why the bucket itself
 * has no client-writable policies. Returns an
 * error string instead of throwing so callers can surface it as a normal
 * form field error (same convention as lib/supabase/gallery-storage.ts).
 */
export async function uploadPartnerLogo(
  file: File,
  itemId: string
): Promise<{ url: string } | { error: string }> {
  const validationError = validateImageFile(file)
  if (validationError) return { error: validationError }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const path = `${itemId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false
  })

  if (error) {
    console.error('[partner-logos] image upload failed', error)
    return { error: 'Could not upload the logo. Please try again.' }
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

/**
 * Best-effort delete — failures here shouldn't block the calling action.
 * Only removes files that actually live in the 'partner-logos' storage
 * bucket; seeded rows point at static files under /public/images/partners,
 * which this silently skips (no matching URL marker), same as the gallery
 * equivalent skips non-bucket URLs.
 */
export async function deletePartnerLogoByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    const admin = createAdminClient()
    await admin.storage.from(BUCKET).remove([path])
  } catch (err) {
    console.error('[partner-logos] failed to delete old logo', err)
  }
}
