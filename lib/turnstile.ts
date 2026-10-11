import 'server-only'

/**
 * Cloudflare Turnstile server-side verification.
 *
 * Configure with TURNSTILE_SECRET_KEY (server) and NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * (browser widget). When the secret is not set, verification is skipped so local
 * development and previews keep working; set it in production to turn it on.
 * Tokens are single-use and expire after 5 minutes, so the widget is reset after
 * every submission (see components/shared/TurnstileWidget.tsx).
 */

export const TURNSTILE_FIELD = 'cf-turnstile-response'
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  ok: boolean
  /** True when no secret is configured and the check was not performed. */
  skipped?: boolean
  reason?: 'missing-token' | 'rejected' | 'verification-unavailable'
}

let warnedUnconfigured = false

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstile(token: unknown, remoteIp?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && !warnedUnconfigured) {
      warnedUnconfigured = true
      console.warn('[turnstile] TURNSTILE_SECRET_KEY is not set: bot protection is disabled on public forms.')
    }
    return { ok: true, skipped: true }
  }

  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    return { ok: false, reason: 'missing-token' }
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp)
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    })
    if (!response.ok) return { ok: false, reason: 'verification-unavailable' }
    const data = (await response.json()) as { success?: boolean }
    return data.success === true ? { ok: true } : { ok: false, reason: 'rejected' }
  } catch (err) {
    console.error('[turnstile] verification request failed', err)
    return { ok: false, reason: 'verification-unavailable' }
  }
}

/** Reads the token the widget adds to a submitted <form>. */
export function turnstileTokenFromFormData(formData: FormData): string {
  const value = formData.get(TURNSTILE_FIELD)
  return typeof value === 'string' ? value : ''
}

export const TURNSTILE_FAILED_MESSAGE = 'Please complete the security check and try again.'
