import 'server-only'
import { createHash } from 'node:crypto'
import { createAdminClient } from './supabase/admin'
import { getPublicChallenge, type PublicChallenge } from './tech-zone'
import type { BadgeKey } from '../data/playground'

type Admin = ReturnType<typeof createAdminClient>

// Nigeria is UTC+1 all year (no DST), so day/week boundaries are computed in WAT.
const WAT_OFFSET_MS = 60 * 60 * 1000

export function watDateString(now = Date.now()) {
  return new Date(now + WAT_OFFSET_MS).toISOString().slice(0, 10)
}

export type Period = 'today' | 'week' | 'month' | 'all'
export const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'all', label: 'All Time' }
]

export function periodStart(period: Period, now = Date.now()): string | null {
  if (period === 'all') return null
  const wat = new Date(now + WAT_OFFSET_MS)
  const y = wat.getUTCFullYear(), m = wat.getUTCMonth(), d = wat.getUTCDate()
  let startWat: number
  if (period === 'today') startWat = Date.UTC(y, m, d)
  else if (period === 'month') startWat = Date.UTC(y, m, 1)
  else { const dow = (wat.getUTCDay() + 6) % 7; startWat = Date.UTC(y, m, d - dow) } // Monday
  return new Date(startWat - WAT_OFFSET_MS).toISOString()
}

export function nextWeeklyReset(now = Date.now()): Date {
  const start = new Date(periodStart('week', now) as string).getTime()
  return new Date(start + 7 * 24 * 3600 * 1000)
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function validToken(token: unknown): token is string {
  return typeof token === 'string' && token.length >= 20 && token.length <= 100 && /^[A-Za-z0-9_-]+$/.test(token)
}

const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'rape', 'porn', 'sex', 'dick', 'pussy', 'whore', 'slut', 'admin', 'aptech', 'staff', 'official', 'moderator', 'hitler', 'nazi', 'asshole', 'bastard']
export function validateDisplayName(raw: string): { ok: true; name: string; key: string } | { ok: false; message: string } {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < 3 || name.length > 20) return { ok: false, message: 'Choose a name between 3 and 20 characters.' }
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]*$/.test(name)) return { ok: false, message: 'Use letters, numbers, spaces, dots, dashes or underscores only.' }
  if (/@|https?:|www\.|\.com|\.ng/i.test(name) || name.replace(/\D/g, '').length >= 7) return { ok: false, message: 'Display names cannot contain emails, links or phone numbers.' }
  const squashed = name.toLowerCase().replace(/[^a-z]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/\$/g, 's')
  const alt = name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's')
  if (BLOCKED.some((w) => squashed.includes(w) || alt.includes(w))) return { ok: false, message: 'Please choose a different name.' }
  return { ok: true, name, key: name.toLowerCase().replace(/[\s._-]+/g, '') }
}

export async function getOrCreateParticipant(admin: Admin, token: string) {
  const token_hash = hashToken(token)
  const { data: existing } = await admin.from('playground_participants').select('id,display_name,is_hidden,lead_id').eq('token_hash', token_hash).maybeSingle()
  if (existing) {
    void admin.from('playground_participants').update({ last_seen_at: new Date().toISOString() }).eq('id', existing.id)
    return existing as { id: string; display_name: string | null; is_hidden: boolean; lead_id: string | null }
  }
  const { data, error } = await admin.from('playground_participants').insert({ token_hash }).select('id,display_name,is_hidden,lead_id').single()
  if (error || !data) {
    // Concurrent first requests may race on the unique token hash; re-read.
    const { data: again } = await admin.from('playground_participants').select('id,display_name,is_hidden,lead_id').eq('token_hash', token_hash).maybeSingle()
    if (again) return again as { id: string; display_name: string | null; is_hidden: boolean; lead_id: string | null }
    throw error || new Error('participant create failed')
  }
  return data as { id: string; display_name: string | null; is_hidden: boolean; lead_id: string | null }
}

export async function getBadges(admin: Admin, participantId: string): Promise<{ key: BadgeKey; awardedAt: string }[]> {
  const { data } = await admin.from('playground_badges').select('badge_key,awarded_at').eq('participant_id', participantId).order('awarded_at')
  return (data ?? []).map((b: any) => ({ key: b.badge_key as BadgeKey, awardedAt: b.awarded_at as string }))
}

/** Awards badges idempotently and returns only the newly earned keys. */
export async function awardBadges(admin: Admin, participantId: string, keys: BadgeKey[]): Promise<BadgeKey[]> {
  const unique = [...new Set(keys)]
  if (!unique.length) return []
  const { data: have } = await admin.from('playground_badges').select('badge_key').eq('participant_id', participantId).in('badge_key', unique)
  const owned = new Set((have ?? []).map((b: any) => b.badge_key))
  const fresh = unique.filter((k) => !owned.has(k))
  if (!fresh.length) return []
  const { error } = await admin.from('playground_badges').upsert(fresh.map((badge_key) => ({ participant_id: participantId, badge_key })), { onConflict: 'participant_id,badge_key', ignoreDuplicates: true })
  if (error) { console.error('[playground] badges', error); return [] }
  return fresh
}

export type LeaderboardRow = { rank: number; displayName: string; percentage: number; score: number; maxScore: number; challenge: string; timeSeconds: number; participantId?: string }

/**
 * Best completed attempt per public participant in a period, ranked by
 * percentage (desc) then completion time (asc). Daily-streak challenges are
 * excluded (they are 3 easy questions and not competitive).
 * Fetches a bounded window and de-duplicates in memory.
 */
export async function getLeaderboard(period: Period, limit = 25, includeIds = false): Promise<LeaderboardRow[]> {
  const admin = createAdminClient()
  let q = admin.from('tech_challenge_attempts')
    .select('participant_id,percentage,score,max_score,completion_time_seconds,completed_at,tech_challenges!inner(name,playground_kind),playground_participants!inner(display_name,is_hidden)')
    .eq('completion_status', 'completed').eq('is_hidden', false).not('participant_id', 'is', null)
    .eq('playground_participants.is_hidden', false).not('playground_participants.display_name', 'is', null)
    .order('percentage', { ascending: false }).order('completion_time_seconds', { ascending: true }).limit(1000)
  const from = periodStart(period)
  if (from) q = q.gte('completed_at', from)
  const { data, error } = await q
  if (error) { console.error('[playground] leaderboard', error); return [] }
  const seen = new Set<string>()
  const rows: LeaderboardRow[] = []
  for (const a of (data ?? []) as any[]) {
    const kind = a.tech_challenges?.playground_kind
    if (kind === 'daily' || seen.has(a.participant_id)) continue
    seen.add(a.participant_id)
    rows.push({ rank: rows.length + 1, displayName: a.playground_participants?.display_name ?? 'Player', percentage: Number(a.percentage), score: a.score, maxScore: a.max_score, challenge: a.tech_challenges?.name ?? '', timeSeconds: a.completion_time_seconds ?? 0, ...(includeIds ? { participantId: a.participant_id } : {}) })
  }
  return limit ? rows.slice(0, limit) : rows
}

export async function getParticipantRank(participantId: string, period: Period) {
  const rows = await getLeaderboard(period, 0, true)
  const row = rows.find((r) => r.participantId === participantId)
  return { rank: row?.rank ?? null, total: rows.length }
}

export async function getChallengePercentile(admin: Admin, challengeId: string, percentage: number, minSample = 20) {
  const base = () => admin.from('tech_challenge_attempts').select('id', { count: 'exact', head: true }).eq('challenge_id', challengeId).eq('completion_status', 'completed')
  const [{ count: total }, { count: lower }] = await Promise.all([base(), base().lt('percentage', percentage)])
  if (!total || total < minSample) return null
  return Math.round(((lower ?? 0) / total) * 100)
}

export async function getChallengeHighScore(challengeId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('tech_challenge_attempts')
    .select('percentage,completion_time_seconds,playground_participants(display_name,is_hidden)')
    .eq('challenge_id', challengeId).eq('completion_status', 'completed').eq('is_hidden', false).not('participant_id', 'is', null)
    .order('percentage', { ascending: false }).order('completion_time_seconds', { ascending: true }).limit(10)
  const top = (data ?? []).find((a: any) => a.playground_participants?.display_name && !a.playground_participants?.is_hidden) as any
  return top ? { percentage: Number(top.percentage), seconds: top.completion_time_seconds as number, name: top.playground_participants.display_name as string } : null
}

export async function getPlaygroundChallenges(kind: NonNullable<PublicChallenge['playground_kind']>, extra?: { category?: string }): Promise<PublicChallenge[]> {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  let q = admin.from('tech_challenges')
    .select('id,name,slug,description,category,difficulty,estimated_minutes,challenge_type,is_featured,is_weekly,sort_order,time_limit_seconds,playground_kind,detective_category,streak_day,start_date,end_date,tech_challenge_questions(count)')
    .eq('status', 'active').eq('playground_kind', kind).or(`start_date.is.null,start_date.lte.${now}`).or(`end_date.is.null,end_date.gte.${now}`)
  if (extra?.category) q = q.eq('detective_category', extra.category)
  const { data, error } = await q.order('sort_order')
  if (error) { console.error('[playground] challenges', error); return [] }
  return (data ?? []).map((c: any) => ({ ...c, question_count: c.tech_challenge_questions?.[0]?.count ?? 0, tech_challenge_questions: undefined }))
}

export async function getActiveWeekly() {
  const list = await getPlaygroundChallenges('weekly')
  const sorted = [...list].sort((a, b) => (Date.parse(b.start_date ?? '') || 0) - (Date.parse(a.start_date ?? '') || 0))
  const meta = sorted[0]
  if (!meta) return null
  const full = await getPublicChallenge(meta.slug, { playground: true })
  return full ? { ...full, meta } : null
}

export async function getStreakProgress(admin: Admin, participantId: string) {
  const { data } = await admin.from('playground_streak_days').select('day_number,completed_on').eq('participant_id', participantId).order('day_number')
  const done = (data ?? []) as { day_number: number; completed_on: string }[]
  const completedDays = done.map((d) => d.day_number)
  const next = Math.min(7, completedDays.length + 1)
  const last = done[done.length - 1]
  const today = watDateString()
  const unlockedToday = completedDays.length >= 7 ? false : !(last && last.completed_on === today)
  return { completedDays, nextDay: completedDays.length >= 7 ? null : next, canPlayToday: unlockedToday, finished: completedDays.length >= 7, lastCompletedOn: last?.completed_on ?? null }
}

export async function getPlaygroundChallengeByKind(kind: NonNullable<PublicChallenge['playground_kind']>, category?: string) {
  const list = await getPlaygroundChallenges(kind, category ? { category } : undefined)
  const meta = list[0]
  if (!meta) return null
  const full = await getPublicChallenge(meta.slug, { playground: true })
  return full && full.questions.length ? { ...full, meta } : null
}

export async function getStreakDays() {
  const list = await getPlaygroundChallenges('daily')
  const byDay = new Map(list.filter((c) => c.streak_day).map((c) => [c.streak_day as number, c]))
  const days = await Promise.all([1, 2, 3, 4, 5, 6, 7].map(async (day) => {
    const meta = byDay.get(day)
    const full = meta ? await getPublicChallenge(meta.slug, { playground: true }) : null
    return full && full.questions.length ? { day, challenge: full.challenge, questions: full.questions } : null
  }))
  return days.filter(Boolean) as { day: number; challenge: any; questions: any[] }[]
}
