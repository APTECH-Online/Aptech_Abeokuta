import 'server-only'

/**
 * Centralised Supabase environment configuration.
 *
 * Preferred names match the current Vercel/Supabase setup used by this CRM:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SECRET_KEY
 *
 * Legacy names are accepted as fallbacks so existing deployments do not break.
 */
export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  return { url, anonKey, secretKey }
}

export function requireSupabaseConfig() {
  const { url, anonKey, secretKey } = getSupabaseConfig()

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in the server environment.'
    )
  }

  return { url, anonKey, secretKey }
}
