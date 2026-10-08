'use server'

import { recordConsent } from '../../../lib/consent'
import { headers } from 'next/headers'
import { createAdminClient } from '../../../lib/supabase/admin'
import { checkRateLimit } from '../../../lib/rate-limit'
import { findExistingLead } from '../../../lib/duplicate'
import { generateLeadReference } from '../../../lib/reference'
import { createNotification } from '../../../lib/notifications'

function clean(v: FormDataEntryValue | null) { return String(v ?? '').trim().slice(0, 1000) }
function level(p: number) { return p >= 90 ? 'Tech Pro' : p >= 75 ? 'Skilled' : p >= 50 ? 'Explorer' : 'Beginner' }
function resultMessage(value: string) {
  return value === 'Tech Pro' ? 'Excellent problem-solving and technology instincts.' : value === 'Skilled' ? 'Strong technology understanding with useful problem-solving ability.' : value === 'Explorer' ? 'A solid foundation — keep exploring and practising.' : 'A good starting point. The best way to improve is to keep practising.'
}
function safeAttribution(raw: string) {
  try {
    const a = JSON.parse(raw || '{}')
    return {
      firstSource: String(a.firstSource || '').slice(0, 120), firstMedium: String(a.firstMedium || '').slice(0, 120), firstCampaign: String(a.firstCampaign || '').slice(0, 120), firstCampaignId: String(a.firstCampaignId || '').slice(0, 120),
      lastSource: String(a.lastSource || '').slice(0, 120), lastMedium: String(a.lastMedium || '').slice(0, 120), lastCampaign: String(a.lastCampaign || '').slice(0, 120), lastCampaignId: String(a.lastCampaignId || '').slice(0, 120),
      landingPage: String(a.landingPage || '').slice(0, 240), referrer: String(a.referrer || '').slice(0, 500)
    }
  } catch { return {} }
}

export async function startChallenge(input: { challengeId: string; sessionId?: string; attribution?: any }) {
  try {
    const admin = createAdminClient()
    const { data: challenge } = await admin.from('tech_challenges').select('id,status,start_date,end_date').eq('id', input.challengeId).eq('status', 'active').maybeSingle()
    if (!challenge) return { ok: false, message: 'This challenge is not currently available.' }
    const now = Date.now()
    if ((challenge.start_date && new Date(challenge.start_date).getTime() > now) || (challenge.end_date && new Date(challenge.end_date).getTime() < now)) return { ok: false, message: 'This challenge is not currently available.' }
    const { data, error } = await admin.from('tech_challenge_attempts').insert({ challenge_id: challenge.id, session_id: String(input.sessionId || '').slice(0, 120) || null, attribution: safeAttribution(JSON.stringify(input.attribution || {})) }).select('id').single()
    if (error) throw error
    return { ok: true, attemptId: data.id }
  } catch (e) {
    console.error('[tech-zone] start', e)
    return { ok: false, message: 'We could not start the challenge. Please try again.' }
  }
}

export async function submitChallenge(input: { attemptId: string; answers: { questionId: string; answerIndex: number }[]; completionTimeSeconds: number; attribution?: any }) {
  try {
    if (!input.attemptId || !Array.isArray(input.answers) || input.answers.length > 50) return { ok: false, message: 'Invalid challenge submission.' }
    const admin = createAdminClient()
    const { data: attempt } = await admin.from('tech_challenge_attempts').select('id,challenge_id,started_at,completion_status').eq('id', input.attemptId).maybeSingle()
    if (!attempt || attempt.completion_status !== 'started') return { ok: false, message: 'This challenge attempt is no longer active.' }
    const { data: questions } = await admin.from('tech_challenge_questions').select('id,correct_answer,points,skill_area,difficulty').eq('challenge_id', attempt.challenge_id).order('sort_order')
    const questionRows: any[] = questions ?? []
    if (!questionRows.length) return { ok: false, message: 'This challenge has no questions.' }

    const allowed = new Map(questionRows.map((q: any) => [q.id, q]))
    const unique = new Map(input.answers.map(a => [a.questionId, a.answerIndex]))
    let score = 0
    let correct = 0
    const answers: any[] = []
    const skills = new Set<string>()
    let reached = 'beginner'

    for (const [questionId, answerIndex] of unique) {
      const q = allowed.get(questionId)
      if (!q || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 20) continue
      const isCorrect = answerIndex === q.correct_answer
      if (isCorrect) { score += q.points; correct++; skills.add(q.skill_area) }
      if (q.difficulty === 'advanced') reached = 'advanced'
      else if (q.difficulty === 'intermediate' && reached === 'beginner') reached = 'intermediate'
      answers.push({ attempt_id: attempt.id, question_id: q.id, answer_index: answerIndex, is_correct: isCorrect, points_awarded: isCorrect ? q.points : 0 })
    }

    const maxScore = questionRows.reduce((n: number, q: any) => n + q.points, 0)
    const percentage = maxScore ? Math.round((score / maxScore) * 10000) / 100 : 0
    const resultLevel = level(percentage)
    const { data: challenge } = await admin.from('tech_challenges').select('name,recommendation_rules').eq('id', attempt.challenge_id).single()
    const rules = Array.isArray(challenge?.recommendation_rules) ? challenge.recommendation_rules : []
    const skillList = [...skills]
    const programmeCodes = [...new Set(rules.filter((r: any) => skillList.includes(String(r.skillArea || ''))).flatMap((r: any) => Array.isArray(r.programmeCodes) ? r.programmeCodes : []))].slice(0, 5)
    let recommendations: any[] = []
    if (programmeCodes.length) {
      const { data } = await admin.from('programmes').select('id,name,code').in('code', programmeCodes).eq('status', 'active')
      recommendations = data ?? []
    }

    if (answers.length) {
      const { error } = await admin.from('tech_challenge_answers').insert(answers)
      if (error) throw error
    }
    await admin.from('tech_challenge_attempts').update({
      score, max_score: maxScore, percentage, result_level: resultLevel, correct_answers: correct,
      incorrect_answers: Math.max(0, questionRows.length - correct), completion_time_seconds: Math.max(1, Math.min(3600, Math.round(input.completionTimeSeconds || 0))),
      difficulty_reached: reached, completion_status: 'completed', recommended_programme_ids: recommendations.map(r => r.id),
      skill_areas: skillList, attribution: safeAttribution(JSON.stringify(input.attribution || {})), completed_at: new Date().toISOString(), result_viewed_at: new Date().toISOString()
    }).eq('id', attempt.id)
    await admin.from('conversion_events').insert({ event_name: 'challenge_completed', metadata: { attemptId: attempt.id, challenge: challenge?.name, score, percentage, resultLevel } })
    return { ok: true, result: { score, maxScore, percentage, resultLevel, correctAnswers: correct, completionTimeSeconds: Math.max(1, Math.round(input.completionTimeSeconds || 0)), skillAreas: skillList, recommendations, message: resultMessage(resultLevel) } }
  } catch (e) {
    console.error('[tech-zone] submit', e)
    return { ok: false, message: 'We could not save this result. Please try again.' }
  }
}

async function upsertChallengeLead(admin: ReturnType<typeof createAdminClient>, name: string, email: string, phone: string, attribution: any) {
  if (email || phone) {
    const existing = await findExistingLead(admin, { email: email || `challenge-${crypto.randomUUID()}@lead.invalid`, phone: phone || 'Not provided' })
    if (existing) return { id: existing.id, lead_reference: existing.lead_reference }
  }
  const parts = name.split(/\s+/)
  const ref = await generateLeadReference(admin)
  const { data, error } = await admin.from('leads').insert({
    lead_reference: ref, first_name: parts[0], last_name: parts.slice(1).join(' ') || '—',
    email: email || `challenge-${crypto.randomUUID()}@lead.invalid`, phone: phone || 'Not provided', status: 'new', source: 'tech_challenge',
    landing_page: attribution.landingPage || '/tech-zone', referrer: attribution.referrer || null, utm_source: attribution.lastSource || null, utm_medium: attribution.lastMedium || null, utm_campaign: attribution.lastCampaign || null,
    first_touch_source: attribution.firstSource || null, first_touch_medium: attribution.firstMedium || null, first_touch_campaign: attribution.firstCampaign || null, first_touch_campaign_id: attribution.firstCampaignId || null,
    last_touch_source: attribution.lastSource || null, last_touch_medium: attribution.lastMedium || null, last_touch_campaign: attribution.lastCampaign || null, last_touch_campaign_id: attribution.lastCampaignId || null,
    conversion_point: 'tech_zone_result', attribution_landing_page: attribution.landingPage || '/tech-zone', attribution_referrer: attribution.referrer || null
  }).select('id,lead_reference').single()
  if (error || !data) throw error || new Error('Lead creation failed')
  return data
}

export async function captureChallengeLead(formData: FormData) {
  const headerList = await headers(); const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`tech-zone-lead:${ip}`).allowed) return { ok: false, message: 'Please wait a moment before submitting another result.' }
  const attemptId = clean(formData.get('attemptId')); const name = clean(formData.get('name')); const email = clean(formData.get('email')).toLowerCase(); const phone = clean(formData.get('phone')); const preference = clean(formData.get('communicationPreference')) || 'none'; const consent = formData.get('consent') === 'yes'
  if (!attemptId || !name || !consent) return { ok: false, message: 'Please provide your name and consent to receive the result.' }
  if (!email && !phone) return { ok: false, message: 'Please provide an email address or phone/WhatsApp number.' }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Please enter a valid email address.' }
  if (phone && !/^[+]?\d[\d\s().-]{6,19}$/.test(phone)) return { ok: false, message: 'Please enter a valid phone number.' }
  try {
    const admin = createAdminClient()
    const { data: attempt } = await admin.from('tech_challenge_attempts').select('*,tech_challenges(name,slug)').eq('id', attemptId).maybeSingle()
    if (!attempt || attempt.completion_status !== 'completed') return { ok: false, message: 'Please complete the challenge before requesting your result.' }
    const attribution = attempt.attribution || {}
    const lead = await upsertChallengeLead(admin, name, email, phone, attribution)
    const recIds = attempt.recommended_programme_ids || []
    for (const programmeId of recIds) await admin.from('lead_interests').insert({ lead_id: lead.id, programme_id: programmeId })
    const description = `Completed ${attempt.tech_challenges?.name || 'Tech Zone challenge'} with ${attempt.percentage}% (${attempt.result_level}). Score ${attempt.score}/${attempt.max_score}. Skills: ${(attempt.skill_areas || []).join(', ') || 'technology fundamentals'}.`
    await recordConsent(admin, { leadId: lead.id, source: 'tech_zone', marketingOptIn: true, page: '/tech-zone' })
    await admin.from('interactions').insert({ lead_id: lead.id, user_id: null, type: 'website', subject: `Tech Zone: ${attempt.tech_challenges?.name || 'Challenge'} completed`, description })
    await admin.from('tech_challenge_attempts').update({ lead_id: lead.id, consented_to_follow_up: true, communication_preference: preference, captured_at: new Date().toISOString() }).eq('id', attemptId)
    await admin.from('conversion_events').insert({ event_name: 'challenge_lead_captured', lead_id: lead.id, metadata: { attemptId, challenge: attempt.tech_challenges?.slug, score: attempt.score, percentage: attempt.percentage, resultLevel: attempt.result_level, preference } })
    await Promise.allSettled([createNotification(admin, { type: 'lead.created', title: `Tech Zone lead: ${name}`, body: description, link: `/admin/leads/${lead.id}`, entity: 'lead', entityId: lead.id, targetRoles: ['admissions_officer', 'super_admin'] })])
    return { ok: true, leadReference: lead.lead_reference }
  } catch (e) { console.error('[tech-zone] capture', e); return { ok: false, message: 'We could not save your result right now. Please try again shortly.' } }
}

export async function captureLegacyTechIqLead(formData: FormData) {
  const headerList = await headers(); const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`tech-iq-lead:${ip}`).allowed) return { ok: false, message: 'Please wait a moment before submitting another result.' }
  const name = clean(formData.get('name')); const email = clean(formData.get('email')).toLowerCase(); const phone = clean(formData.get('phone')); const score = Math.max(0, Math.min(5, Number(formData.get('score')) || 0)); const consent = formData.get('consent') === 'yes'
  if (!name || !consent) return { ok: false, message: 'Please provide your name and consent to receive the result.' }
  if (!email && !phone) return { ok: false, message: 'Please provide an email address or phone/WhatsApp number.' }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Please enter a valid email address.' }
  if (phone && !/^[+]?\d[\d\s().-]{6,19}$/.test(phone)) return { ok: false, message: 'Please enter a valid phone number.' }
  try {
    const admin = createAdminClient(); const attribution = safeAttribution(clean(formData.get('attribution')))
    const lead = await upsertChallengeLead(admin, name, email, phone, attribution)
    const resultLevel = score >= 4 ? 'Tech Pro' : score >= 3 ? 'Skilled' : score >= 2 ? 'Explorer' : 'Beginner'
    const description = `Completed Tech IQ Challenge with ${score}/5 (${Math.round(score / 5 * 100)}%). Result level: ${resultLevel}.`
    await recordConsent(admin, { leadId: lead.id, source: 'tech_zone', marketingOptIn: true, page: '/' })
    await admin.from('interactions').insert({ lead_id: lead.id, user_id: null, type: 'website', subject: 'Tech IQ Challenge completed', description })
    await admin.from('conversion_events').insert({ event_name: 'challenge_lead_captured', lead_id: lead.id, metadata: { challenge: 'tech_iq', score, resultLevel } })
    await Promise.allSettled([createNotification(admin, { type: 'lead.created', title: `Tech IQ lead: ${name}`, body: description, link: `/admin/leads/${lead.id}`, entity: 'lead', entityId: lead.id, targetRoles: ['admissions_officer', 'super_admin'] })])
    return { ok: true, leadReference: lead.lead_reference }
  } catch (e) { console.error('[tech-iq] capture', e); return { ok: false, message: 'We could not save your result right now. Please try again shortly.' } }
}
