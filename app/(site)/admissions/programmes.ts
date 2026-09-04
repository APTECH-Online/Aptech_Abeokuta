import 'server-only'
import { createAdminClient } from '../../../lib/supabase/admin'

/**
 * The `programmes` table is staff-only under RLS (see migration 0001), but
 * the public admissions form still needs to list active programmes by
 * name. This runs entirely on the server (a Server Component import only)
 * and returns just the handful of non-sensitive fields the form needs —
 * never the service-role key or anything else from the admin client leaks
 * to the browser.
 */
export async function getActiveProgrammesForPublicForm(): Promise<
  { id: string; name: string; duration: string | null }[]
> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('programmes')
      .select('id, name, duration')
      .eq('status', 'active')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[admissions] failed to load programmes', error)
      return []
    }

    return data ?? []
  } catch (err) {
    // Supabase not configured yet — fail soft so the public site still renders.
    console.error('[admissions] programmes lookup unavailable', err)
    return []
  }
}
