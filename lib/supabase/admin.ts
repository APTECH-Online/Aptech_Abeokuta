import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Privileged Supabase client using the service-role key. This bypasses Row
 * Level Security entirely, so it must NEVER be imported from a Client
 * Component or exposed to the browser in any way.
 *
 * The `server-only` import above makes Next.js throw a build error if this
 * module is ever pulled into client-side code.
 *
 * Use this only inside:
 *  - Server Actions (files with 'use server')
 *  - Route Handlers (app/api/**\/route.ts)
 * and only after the caller's identity/role has already been checked with
 * lib/auth.ts, or for the public admissions form submission path (which is
 * intentionally unauthenticated but rate-limited and validated).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
