import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireSupabaseConfig } from './config'

/**
 * Privileged Supabase client. The secret/service-role key bypasses RLS and must
 * remain server-only. Never import this from a Client Component.
 */
export function createAdminClient() {
  const { url, secretKey } = requireSupabaseConfig()

  if (!secretKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_SECRET_KEY in the server environment.'
    )
  }

  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
