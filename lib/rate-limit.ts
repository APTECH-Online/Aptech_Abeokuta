import 'server-only'

/**
 * Rate limiter for public endpoints.
 *
 * Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the
 * Vercel KV names KV_REST_API_URL + KV_REST_API_TOKEN). Counters then live in
 * Redis, so the limit is global across every serverless instance and survives
 * cold starts. Uses the Upstash REST API over fetch: no extra dependency.
 *
 * Without those variables (local dev, previews) or if Redis is unreachable, it
 * falls back to a per-instance in-memory counter so forms keep working. A Redis
 * outage degrades to the old best-effort behaviour instead of blocking visitors.
 *
 * Algorithm: fixed window. First hit in a window creates the key with a TTL;
 * every hit increments it; over `limit` is refused until the key expires.
 */

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export interface RateLimitOptions {
  /** Max requests per window. Default 5. */
  limit?: number
  /** Window length in seconds. Default 60. */
  windowSeconds?: number
}

const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_SECONDS = 60
const KEY_PREFIX = 'aptech:rl:'
const REDIS_TIMEOUT_MS = 1500

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

async function checkRedis(
  config: { url: string; token: string },
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  const redisKey = `${KEY_PREFIX}${key}`
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'content-type': 'application/json' },
      // SET NX creates the window once; INCR counts; TTL tells us when it resets.
      body: JSON.stringify([
        ['SET', redisKey, '0', 'EX', String(windowSeconds), 'NX'],
        ['INCR', redisKey],
        ['TTL', redisKey]
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS)
    })
    if (!response.ok) return null
    const body = (await response.json()) as Array<{ result?: unknown; error?: string }>
    const count = Number(body?.[1]?.result)
    const ttl = Number(body?.[2]?.result)
    if (!Number.isFinite(count)) return null
    if (count > limit) {
      return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds }
    }
    return { allowed: true }
  } catch (err) {
    console.error('[rate-limit] Redis unavailable, using in-memory fallback', err)
    return null
  }
}

const hits = new Map<string, number[]>()

/** Per-instance fallback. Exported for tests. */
export function checkRateLimitInMemory(key: string, limit = DEFAULT_LIMIT, windowSeconds = DEFAULT_WINDOW_SECONDS): RateLimitResult {
  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    const retryAfterMs = windowMs - (now - timestamps[0])
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > windowMs)) hits.delete(k)
    }
  }

  return { allowed: true }
}

/** Clears the in-memory counters. For tests only. */
export function resetInMemoryRateLimits() {
  hits.clear()
}

export async function checkRateLimit(key: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS

  const config = redisConfig()
  if (config) {
    const result = await checkRedis(config, key, limit, windowSeconds)
    if (result) return result
  }
  return checkRateLimitInMemory(key, limit, windowSeconds)
}
