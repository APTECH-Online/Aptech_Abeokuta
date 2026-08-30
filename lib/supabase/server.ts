import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Supabase client for use in Server Components, Server Actions and Route
 * Handlers. Reads/writes the visitor's own auth session via cookies, so
 * queries run as that authenticated user — Row Level Security applies.
 *
 * Only ever import this on the server (files with no 'use client').
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component with no request context to
            // mutate — safe to ignore as long as middleware also refreshes
            // the session.
          }
        }
      }
    }
  )
}
