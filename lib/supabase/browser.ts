'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in Client Components. Only ever uses the public
 * anon key — never the service-role key. The anon key has no table
 * permissions of its own (see RLS policies); it can only authenticate a
 * session, which the server then trusts for its own scoped reads.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
