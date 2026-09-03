import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requireSupabaseConfig } from './config'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the visitor's auth session via cookies, so Row Level Security
 * applies to normal data access.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = requireSupabaseConfig()

  return createServerClient(url, anonKey, {
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
          // Server Components may not have a mutable cookie context. Middleware
          // refreshes the session for normal requests.
        }
      }
    }
  })
}
