'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '../../../lib/supabase/admin'
import { checkRateLimit } from '../../../lib/rate-limit'
import { recordConsent } from '../../../lib/consent'
import { createNotification } from '../../../lib/notifications'
import { safeAttribution, upsertPlaygroundLead } from '../../../lib/playground-lead'
import {
  awardBadges, getBadges, getChallengePercentile, getOrCreateParticipant, getParticipantRank, getStreakProgress,
  validateDisplayName, validToken, watDateString
} from '../../../lib/playground'
import { CAREER_QUIZ_QUESTIONS, CAREERS, CODE_TASKS, PATHFINDER_QUESTIONS, scoreCareers, type BadgeKey } from '../../../data/playground'

type Fail = { ok: false; message: string }
const fail = (message: string): Fail => ({ ok: false, message })

async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
const clean = (v: FormDataEntryValue | null, n = 1000) => String(v ?? '').trim().slice(0, n)
const levelFor = (p: number) => (p >= 90 ? 'Tech Pro' : p >= 75 ? 'Skilled' : p >= 50 ? 'Explorer' : 'Beginner')
const messageFor = (l: string) => l === 'Tech Pro' ? 'Excellent problem-solving and technology instincts.' : l === 'Skilled' ? 'Strong technology understanding with useful problem-solving ability.' : l === 'Explorer' ? 'A solid foundation. Keep exploring and practising.' : 'A good starting point. The best way to improve is to keep practising.'

// ---------------------------------------------------------------- participant

export async function initParticipant(token: string) {
  if (!validToken(token)) return fail('Invalid session.')
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, token)
    const [badges, streak] = await Promise.all([getBadges(admin, p.id), getStreakProgress(admin, p.id)])
    return { ok: true as const, displayName: p.display_name, badges, streak }
  } catch (e) { console.error('[playground] init', e); return fail('Could not start your session.') }
}

export async function setPlaygroundDisplayName(input: { token: string; name: string }) {
  if (!validToken(input.token)) return fail('Invalid session.')
  if (!checkRateLimit(`pg-name:${await clientIp()}`).allowed) return fail('Please wait a moment and try again.')
  const v = validateDisplayName(String(input.name ?? ''))
  if (!v.ok) return fail(v.message)
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, input.token)
    const { error } = await admin.from('playground_participants').update({ display_name: v.name, display_name_key: v.key }).eq('id', p.id)
    if (error) return error.code === '23505' ? fail('That name is already taken. Try another.') : fail('Could not save your name.')
    const rank = await getParticipantRank(p.id, 'week')
    const newBadges = rank.rank && rank.rank <= 10 ? await awardBadges(admin, p.id, ['top_10']) : []
    await admin.from('conversion_events').insert({ event_name: 'playground_leaderboard_name_set', metadata: { rank: rank.rank } })
    return { ok: true as const, displayName: v.name, rank: rank.rank, newBadges }
  } catch (e) { console.error('[playground] name', e); return fail('Could not save your name.') }
}

// ---------------------------------------------------------------- attempts

export async function startPlaygroundAttempt(input: { token: string; challengeId: string; attribution?: unknown }) {
  if (!validToken(input.token)) return fail('Invalid session.')
  if (!checkRateLimit(`pg-start:${await clientIp()}`).allowed) return fail('Slow down a little, then try again.')
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data: c } = await admin.from('tech_challenges').select('id,status,start_date,end_date,streak_day,time_limit_seconds,playground_kind')
      .eq('id', input.challengeId).eq('status', 'active').maybeSingle()
    if (!c || (c.start_date && c.start_date > now) || (c.end_date && c.end_date < now)) return fail('This challenge is not currently available.')
    const p = await getOrCreateParticipant(admin, input.token)
    if (c.playground_kind === 'daily' && c.streak_day) {
      const s = await getStreakProgress(admin, p.id)
      if (s.finished) return fail('You have already completed the 7-day streak.')
      if (s.nextDay !== c.streak_day) return fail(s.nextDay ? `Complete Day ${s.nextDay} first.` : 'Streak complete.')
      if (!s.canPlayToday) return fail('Nice work today! Day ' + c.streak_day + ' unlocks tomorrow.')
    }
    const { data, error } = await admin.from('tech_challenge_attempts').insert({ challenge_id: c.id, participant_id: p.id, attribution: safeAttribution(input.attribution) }).select('id,started_at').single()
    if (error || !data) throw error
    await admin.from('conversion_events').insert({ event_name: 'challenge_started', metadata: { attemptId: data.id, kind: c.playground_kind } })
    return { ok: true as const, attemptId: data.id as string, limit: (c.time_limit_seconds as number | null) ?? null }
  } catch (e) { console.error('[playground] start', e); return fail('We could not start the challenge. Please try again.') }
}

/** Checks one answer server-side (answer key never reaches the browser beforehand) and locks it. */
export async function answerPlaygroundQuestion(input: { token: string; attemptId: string; questionId: string; answerIndex: number }) {
  if (!validToken(input.token) || !input.attemptId || !input.questionId || !Number.isInteger(input.answerIndex) || input.answerIndex < 0 || input.answerIndex > 10) return fail('Invalid answer.')
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, input.token)
    const { data: a } = await admin.from('tech_challenge_attempts').select('id,challenge_id,participant_id,completion_status,started_at,tech_challenges(time_limit_seconds)').eq('id', input.attemptId).maybeSingle() as { data: any }
    if (!a || a.participant_id !== p.id || a.completion_status !== 'started') return fail('This attempt is no longer active.')
    const limit: number | null = a.tech_challenges?.time_limit_seconds ?? null
    if (limit && Date.now() > new Date(a.started_at).getTime() + (limit + 3) * 1000) return { ok: false as const, expired: true, message: 'Time is up!' }
    const { data: q } = await admin.from('tech_challenge_questions').select('id,correct_answer,explanation,points,options').eq('id', input.questionId).eq('challenge_id', a.challenge_id).maybeSingle()
    if (!q) return fail('Unknown question.')
    if (input.answerIndex >= (Array.isArray(q.options) ? q.options.length : 0)) return fail('Invalid answer.')
    const isCorrect = input.answerIndex === q.correct_answer
    const { error } = await admin.from('tech_challenge_answers').insert({ attempt_id: a.id, question_id: q.id, answer_index: input.answerIndex, is_correct: isCorrect, points_awarded: isCorrect ? q.points : 0 })
    if (error?.code === '23505') {
      const { data: prev } = await admin.from('tech_challenge_answers').select('answer_index,is_correct').eq('attempt_id', a.id).eq('question_id', q.id).maybeSingle()
      return { ok: true as const, locked: true, isCorrect: !!prev?.is_correct, chosenIndex: prev?.answer_index ?? input.answerIndex, correctIndex: q.correct_answer as number, explanation: (q.explanation as string | null) ?? null, points: q.points as number }
    }
    if (error) throw error
    return { ok: true as const, locked: false, isCorrect, chosenIndex: input.answerIndex, correctIndex: q.correct_answer as number, explanation: (q.explanation as string | null) ?? null, points: q.points as number }
  } catch (e) { console.error('[playground] answer', e); return fail('Could not check that answer.') }
}

export async function finishPlaygroundAttempt(input: { token: string; attemptId: string }) {
  if (!validToken(input.token) || !input.attemptId) return fail('Invalid request.')
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, input.token)
    const { data: a } = await admin.from('tech_challenge_attempts').select('id,challenge_id,participant_id,completion_status,started_at').eq('id', input.attemptId).maybeSingle()
    if (!a || a.participant_id !== p.id) return fail('Attempt not found.')
    if (a.completion_status !== 'started') return fail('This attempt has already been submitted.')
    const { data: ch } = await admin.from('tech_challenges').select('id,name,slug,playground_kind,streak_day,time_limit_seconds,recommendation_rules').eq('id', a.challenge_id).single()
    const [{ data: questions }, { data: answers }] = await Promise.all([
      admin.from('tech_challenge_questions').select('id,points,skill_area,difficulty').eq('challenge_id', a.challenge_id),
      admin.from('tech_challenge_answers').select('question_id,is_correct,points_awarded').eq('attempt_id', a.id)
    ])
    const qs = (questions ?? []) as any[]
    const ans = new Map(((answers ?? []) as any[]).map((x) => [x.question_id, x]))
    const maxScore = qs.reduce((n, q) => n + q.points, 0)
    const score = [...ans.values()].reduce((n, x) => n + x.points_awarded, 0)
    const correct = [...ans.values()].filter((x) => x.is_correct).length
    const percentage = maxScore ? Math.round((score / maxScore) * 10000) / 100 : 0
    const level = levelFor(percentage)
    const limit: number | null = ch?.time_limit_seconds ?? null
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000))
    const seconds = Math.min(limit ?? 3600, elapsed)

    const bySkill = new Map<string, { correct: number; answered: number; total: number }>()
    let reached = 'beginner'
    for (const q of qs) {
      const row = bySkill.get(q.skill_area) ?? { correct: 0, answered: 0, total: 0 }
      row.total++
      const x = ans.get(q.id)
      if (x) { row.answered++; if (x.is_correct) row.correct++ }
      bySkill.set(q.skill_area, row)
      if (x?.is_correct) { if (q.difficulty === 'advanced') reached = 'advanced'; else if (q.difficulty === 'intermediate' && reached === 'beginner') reached = 'intermediate' }
    }
    const skillAreas = [...bySkill.entries()].filter(([, v]) => v.correct > 0).map(([k]) => k)
    const rules = Array.isArray(ch?.recommendation_rules) ? ch!.recommendation_rules as any[] : []
    const codes = [...new Set(rules.filter((r) => skillAreas.includes(String(r.skillArea))).flatMap((r) => Array.isArray(r.programmeCodes) ? r.programmeCodes : []))].slice(0, 4)
    let recommendations: { id: string; name: string; code: string }[] = []
    if (codes.length) { const { data } = await admin.from('programmes').select('id,name,code').in('code', codes).eq('status', 'active'); recommendations = (data ?? []) as any }

    const { error: upErr } = await admin.from('tech_challenge_attempts').update({
      score, max_score: maxScore, percentage, result_level: level, correct_answers: correct, incorrect_answers: Math.max(0, qs.length - correct),
      completion_time_seconds: seconds, difficulty_reached: reached, completion_status: 'completed', recommended_programme_ids: recommendations.map((r) => r.id),
      skill_areas: skillAreas, completed_at: new Date().toISOString(), result_viewed_at: new Date().toISOString()
    }).eq('id', a.id).eq('completion_status', 'started')
    if (upErr) throw upErr

    // Streak
    let streak: { day: number; completedDays: number[]; finished: boolean } | null = null
    if (ch?.playground_kind === 'daily' && ch.streak_day) {
      await admin.from('playground_streak_days').upsert({ participant_id: p.id, day_number: ch.streak_day, attempt_id: a.id, completed_on: watDateString() }, { onConflict: 'participant_id,day_number', ignoreDuplicates: true })
      const s = await getStreakProgress(admin, p.id)
      streak = { day: ch.streak_day, completedDays: s.completedDays, finished: s.finished }
    }

    // Badges
    const earn: BadgeKey[] = ['tech_explorer']
    if (ch?.playground_kind === 'data_detective' && percentage >= 60) earn.push('data_detective')
    if (ch?.playground_kind === 'speed_round' && percentage >= 70) earn.push('speed_champion')
    if (ch?.playground_kind === 'weekly' && percentage >= 80) earn.push('challenge_master')
    if (streak?.finished) earn.push('streak_7')
    const competitive = ch?.playground_kind !== 'daily'
    const named = !!p.display_name && !p.is_hidden
    let rankWeek: number | null = null, rankAll: number | null = null
    if (competitive && named) {
      const [w, all] = await Promise.all([getParticipantRank(p.id, 'week'), getParticipantRank(p.id, 'all')])
      rankWeek = w.rank; rankAll = all.rank
      if (w.rank && w.rank <= 10) earn.push('top_10')
    }
    const newBadges = await awardBadges(admin, p.id, earn)
    const percentile = competitive ? await getChallengePercentile(admin, a.challenge_id, percentage) : null

    await admin.from('conversion_events').insert({ event_name: 'challenge_completed', metadata: { attemptId: a.id, challenge: ch?.name, kind: ch?.playground_kind, score, percentage, resultLevel: level } })

    return {
      ok: true as const,
      result: {
        attemptId: a.id as string, challengeName: ch?.name as string, kind: (ch?.playground_kind ?? null) as string | null,
        score, maxScore, percentage, correctAnswers: correct, totalQuestions: qs.length, answered: ans.size, completionTimeSeconds: seconds,
        resultLevel: level, message: messageFor(level), techIq: Math.round(percentage),
        skills: [...bySkill.entries()].map(([skill, v]) => ({ skill, ...v })),
        recommendations, newBadges, percentile, rankWeek, rankAll, needsDisplayName: competitive && !named, streak
      }
    }
  } catch (e) { console.error('[playground] finish', e); return fail('We could not save your result. Please try again.') }
}

// ---------------------------------------------------------------- non-quiz activities

export async function submitPlaygroundActivity(input: { token: string; kind: 'career_pathfinder' | 'career_quiz' | 'code_lab'; answers?: number[]; codeTaskId?: string; attribution?: unknown }) {
  if (!validToken(input.token)) return fail('Invalid session.')
  if (!checkRateLimit(`pg-activity:${await clientIp()}`).allowed) return fail('Please wait a moment before trying again.')
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, input.token)
    let result: Record<string, unknown> = {}
    const earn: BadgeKey[] = ['tech_explorer']
    if (input.kind === 'code_lab') {
      if (!CODE_TASKS.some((t) => t.id === input.codeTaskId)) return fail('Unknown task.')
      result = { task: input.codeTaskId }
      earn.push('code_starter')
    } else {
      const qs = input.kind === 'career_pathfinder' ? PATHFINDER_QUESTIONS : CAREER_QUIZ_QUESTIONS
      const raw = Array.isArray(input.answers) ? input.answers : []
      if (raw.length !== qs.length || raw.some((n, i) => !Number.isInteger(n) || n < 0 || n >= qs[i].options.length)) return fail('Please answer every question.')
      const map = Object.fromEntries(qs.map((q, i) => [q.id, raw[i]]))
      const scored = scoreCareers(qs, map)
      result = { answers: raw, top: scored.top.map((t) => ({ key: t.key, match: t.match })), meta: scored.meta }
    }
    const { data, error } = await admin.from('playground_activities').insert({ participant_id: p.id, kind: input.kind, result, attribution: safeAttribution(input.attribution) }).select('id').single()
    if (error || !data) throw error
    const newBadges = await awardBadges(admin, p.id, earn)
    await admin.from('conversion_events').insert({ event_name: 'playground_activity_completed', metadata: { kind: input.kind, activityId: data.id } })
    return { ok: true as const, activityId: data.id as string, newBadges }
  } catch (e) { console.error('[playground] activity', e); return fail('Could not save your result.') }
}

export async function capturePlaygroundLead(formData: FormData) {
  const ip = await clientIp()
  if (!checkRateLimit(`pg-lead:${ip}`).allowed) return fail('Please wait a moment before submitting again.')
  const token = clean(formData.get('token'), 100), activityId = clean(formData.get('activityId'), 60)
  const name = clean(formData.get('name'), 150), email = clean(formData.get('email'), 200).toLowerCase(), phone = clean(formData.get('phone'), 30)
  const preference = clean(formData.get('communicationPreference'), 20) || 'none', consent = formData.get('consent') === 'yes'
  if (!validToken(token) || !activityId) return fail('Please complete the activity first.')
  if (!name || !consent) return fail('Please provide your name and consent to receive your roadmap.')
  if (!email && !phone) return fail('Please provide an email address or a phone/WhatsApp number so we can reach you.')
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail('Please enter a valid email address.')
  if (phone && !/^[+]?\d[\d\s().-]{6,19}$/.test(phone)) return fail('Please enter a valid phone number.')
  if (!['email', 'whatsapp', 'phone', 'none'].includes(preference)) return fail('Invalid contact preference.')
  try {
    const admin = createAdminClient()
    const p = await getOrCreateParticipant(admin, token)
    const { data: act } = await admin.from('playground_activities').select('id,kind,result,participant_id,attribution').eq('id', activityId).maybeSingle() as { data: any }
    if (!act || act.participant_id !== p.id) return fail('We could not find your result.')
    let fromClient = safeAttribution({})
    try { fromClient = safeAttribution(JSON.parse(clean(formData.get('attribution'), 3000) || '{}')) } catch { /* ignore malformed attribution */ }
    const stored = safeAttribution(act.attribution)
    const attribution = stored.firstSource || stored.landingPage ? stored : fromClient
    const lead = await upsertPlaygroundLead(admin, { name, email, phone, attribution, conversionPoint: `tech_playground_${act.kind}`, page: '/tech-playground' })
    const topKey = act.result?.top?.[0]?.key as keyof typeof CAREERS | undefined
    const career = topKey ? CAREERS[topKey] : null
    if (career) {
      const { data: prog } = await admin.from('programmes').select('id').eq('code', career.programmeCode).eq('status', 'active').maybeSingle()
      if (prog) {
        const { data: has } = await admin.from('lead_interests').select('lead_id').eq('lead_id', lead.id).eq('programme_id', prog.id).maybeSingle()
        if (!has) await admin.from('lead_interests').insert({ lead_id: lead.id, programme_id: prog.id })
      }
    }
    const label = act.kind === 'career_pathfinder' ? 'Career Pathfinder' : 'Tech Career Quiz'
    const others = (act.result?.top ?? []).slice(1).map((t: any) => CAREERS[t.key as keyof typeof CAREERS]?.title).filter(Boolean)
    const description = `Completed ${label}. Top match: ${career?.title ?? 'n/a'}${others.length ? ` (also: ${others.join(', ')})` : ''}. Recommended: ${career?.programmeLabel ?? 'n/a'}. Level: ${act.result?.meta?.exp || act.result?.meta?.level || 'not stated'}. Time available: ${act.result?.meta?.time || 'not stated'}. Contact preference: ${preference}.`
    await recordConsent(admin, { leadId: lead.id, source: 'tech_zone', marketingOptIn: true, page: '/tech-playground' })
    await admin.from('interactions').insert({ lead_id: lead.id, user_id: null, type: 'website', subject: `Tech Playground: ${label} completed`, description })
    await admin.from('playground_activities').update({ lead_id: lead.id }).eq('id', act.id)
    await admin.from('playground_participants').update({ lead_id: lead.id }).eq('id', p.id)
    await admin.from('conversion_events').insert({ event_name: 'playground_lead_captured', lead_id: lead.id, metadata: { kind: act.kind, career: topKey, preference } })
    await Promise.allSettled([createNotification(admin, { type: 'lead.created', title: `Tech Playground lead: ${name}`, body: description, link: `/admin/leads/${lead.id}`, entity: 'lead', entityId: lead.id, targetRoles: ['admissions_officer', 'super_admin'] })])
    return { ok: true as const, leadReference: lead.lead_reference }
  } catch (e) { console.error('[playground] lead', e); return fail('We could not save your details right now. Please try again shortly.') }
}
