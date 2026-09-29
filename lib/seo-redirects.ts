import 'server-only'
import { createAdminClient } from './supabase/admin'

/**
 * Permanent redirects for CMS-managed URLs whose slug changed.
 *
 * Why: courses and insights live at /courses/[slug] and /insights/[slug], and
 * staff can edit the slug in the CRM. Without this, renaming a slug 404s the
 * old URL and throws away its search rankings and inbound links.
 *
 * How: the update actions call recordSlugChange(); the two [slug] pages call
 * findSlugRedirect() only when a slug is NOT found (so there is no per-request
 * cost on the happy path) and issue a permanent redirect. Redirects are kept
 * flat — recordSlugChange rewrites any earlier hop to point straight at the
 * newest URL — so chains and loops cannot form.
 *
 * Every function is failure-tolerant: if the seo_redirects table does not
 * exist yet (migration 0018 not applied) a save or a 404 still behaves exactly
 * as it did before this feature.
 */

export type RedirectBase = '/courses' | '/insights'

export async function findSlugRedirect(base: RedirectBase, slug: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('seo_redirects')
      .select('to_path')
      .eq('from_path', `${base}/${slug}`)
      .maybeSingle()
    if (error || !data?.to_path) return null
    // Defence in depth: only ever redirect to a same-site path.
    return data.to_path.startsWith('/') && !data.to_path.startsWith('//') ? data.to_path : null
  } catch {
    return null
  }
}

export async function recordSlugChange(
  admin: ReturnType<typeof createAdminClient>,
  base: RedirectBase,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return
  const from = `${base}/${oldSlug}`
  const to = `${base}/${newSlug}`
  try {
    // 1. The new URL is live content again — it must not also be a redirect source (loop guard).
    await admin.from('seo_redirects').delete().eq('from_path', to)
    // 2. Flatten: anything that used to point at the old URL now points at the new one (no chains).
    await admin.from('seo_redirects').update({ to_path: to }).eq('to_path', from)
    // 3. Old URL → new URL.
    const { error } = await admin
      .from('seo_redirects')
      .upsert({ from_path: from, to_path: to, status_code: 301 }, { onConflict: 'from_path' })
    if (error) console.error('[seo] could not record slug redirect', error)
  } catch (err) {
    console.error('[seo] slug redirect bookkeeping failed', err)
  }
}
