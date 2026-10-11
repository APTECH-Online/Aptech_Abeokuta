import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, checkRateLimitInMemory, resetInMemoryRateLimits } from '../lib/rate-limit'

beforeEach(() => {
  resetInMemoryRateLimits()
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.stubEnv('KV_REST_API_URL', '')
  vi.stubEnv('KV_REST_API_TOKEN', '')
})
afterEach(() => vi.useRealTimers())

describe('in-memory fallback', () => {
  it('allows up to the limit then blocks with a retry hint', async () => {
    for (let i = 0; i < 5; i++) expect((await checkRateLimit('k')).allowed).toBe(true)
    const blocked = await checkRateLimit('k')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks keys independently', async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit('a')
    expect((await checkRateLimit('a')).allowed).toBe(false)
    expect((await checkRateLimit('b')).allowed).toBe(true)
  })

  it('honours a custom limit', async () => {
    expect((await checkRateLimit('c', { limit: 2 })).allowed).toBe(true)
    expect((await checkRateLimit('c', { limit: 2 })).allowed).toBe(true)
    expect((await checkRateLimit('c', { limit: 2 })).allowed).toBe(false)
  })

  it('frees the key once the window has passed', () => {
    vi.useFakeTimers()
    for (let i = 0; i < 3; i++) checkRateLimitInMemory('w', 3, 60)
    expect(checkRateLimitInMemory('w', 3, 60).allowed).toBe(false)
    vi.advanceTimersByTime(61_000)
    expect(checkRateLimitInMemory('w', 3, 60).allowed).toBe(true)
  })
})

describe('Redis (Upstash REST) backend', () => {
  const redisReply = (count: number, ttl: number) =>
    new Response(JSON.stringify([{ result: 'OK' }, { result: count }, { result: ttl }]), { status: 200 })

  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test/')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'secret-token')
  })

  it('allows requests under the limit and sends a pipeline with auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(redisReply(2, 55))
    vi.stubGlobal('fetch', fetchMock)
    expect((await checkRateLimit('events:1.2.3.4')).allowed).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://redis.example.test/pipeline')
    expect(init.headers.Authorization).toBe('Bearer secret-token')
    expect(JSON.parse(init.body)[1]).toEqual(['INCR', 'aptech:rl:events:1.2.3.4'])
  })

  it('blocks over the limit and reports the TTL as retry-after', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(redisReply(6, 42)))
    const result = await checkRateLimit('x')
    expect(result).toEqual({ allowed: false, retryAfterSeconds: 42 })
  })

  it('falls back to in-memory (and keeps serving) when Redis errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect((await checkRateLimit('fallback')).allowed).toBe(true)
  })

  it('falls back when Redis answers with an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    expect((await checkRateLimit('fallback2')).allowed).toBe(true)
  })

  it('also accepts the Vercel KV variable names', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example.test')
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token')
    const fetchMock = vi.fn().mockResolvedValue(redisReply(1, 60))
    vi.stubGlobal('fetch', fetchMock)
    await checkRateLimit('kv')
    expect(fetchMock.mock.calls[0][0]).toBe('https://kv.example.test/pipeline')
  })
})
