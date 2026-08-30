import 'server-only'

/**
 * Best-effort in-memory rate limiter, keyed by IP address, for the public
 * admissions form endpoint.
 *
 * Limitation: this resets whenever the serverless function cold-starts and
 * is per-instance, not global — on Vercel this means the effective limit is
 * "per warm instance" rather than a hard global cap. It still meaningfully
 * blocks rapid-fire bot/script submissions and accidental double-clicks. For
 * a stronger guarantee, back this with Upstash Redis or Vercel's Edge
 * Config/KV and swap the implementation here without touching call sites.
 */

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 5

const hits = new Map<string, number[]>()

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - timestamps[0])
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > WINDOW_MS)) hits.delete(k)
    }
  }

  return { allowed: true }
}
