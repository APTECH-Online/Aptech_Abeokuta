'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in Client Components. Only ever uses the public
 * anon/publishable key — never the service-role key. This key has no table
 * permissions of its own (see RLS policies); it can only authenticate a
 * session, which the server then trusts for its own scoped reads.
 *
 * IMPORTANT: Next.js only inlines env vars prefixed NEXT_PUBLIC_ into the
 * browser bundle at build time, so — unlike the server clients in this
 * folder — this file cannot fall back to the unprefixed SUPABASE_* names.
 * It accepts both NEXT_PUBLIC_SUPABASE_ANON_KEY and the newer
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, since either may be set depending
 * on which Supabase API key style the project was created with.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured for the browser. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in the ' +
        'Vercel project environment variables — these must be NEXT_PUBLIC_-prefixed ' +
        'because Client Components run in the browser.'
    )
  }

  return createBrowserClient(url, anonKey)
}
