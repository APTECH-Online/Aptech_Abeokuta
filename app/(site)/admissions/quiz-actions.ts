'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '../../../lib/supabase/admin'
import { checkRateLimit } from '../../../lib/rate-limit'
import { generateLeadReference } from '../../../lib/reference'
import { findExistingLead } from '../../../lib/duplicate'
import { createNotification } from '../../../lib/notifications'
import { DiscoveryAnswers, rankRecommendations } from '../../../lib/program-recommendation'
import type { Course } from '../../../data/courses'

export type QuizLeadState = { status: 'idle' | 'success' | 'error'; message?: string; leadReference?: string }

function clean(value: FormDataEntryValue | null) { return String(value ?? '').trim() }

export async function submitCareerQuizLead(_prev: QuizLeadState, formData: FormData): Promise<QuizLeadState> {
  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
  const rateLimit = checkRateLimit(`career-quiz:${ip}`)
  if (!rateLimit.allowed) return { status: 'error', message: 'Please wait a moment before submitting another enquiry.' }

  const name = clean(formData.get('name'))
  const email = clean(formData.get('email'))
  const phone = clean(formData.get('phone'))
  const programmeId = clean(formData.get('programmeId'))
  const programmeName = clean(formData.get('programmeName'))
  const answersRaw = clean(formData.get('answers'))
  if (!name || !programmeId || !answersRaw) return { status: 'error', message: 'Please complete the discovery experience before sending your details.' }
  if (name.length > 150) return { status: 'error', message: 'Please enter a shorter name.' }
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200)) return { status: 'error', message: 'Please enter a valid email address.' }
  if (phone && !/^[+]?\d[\d\s().-]{6,19}$/.test(phone)) return { status: 'error', message: 'Please enter a valid phone number.' }

  let answers: DiscoveryAnswers
  try { answers = JSON.parse(answersRaw) as DiscoveryAnswers } catch { return { status: 'error', message: 'We could not read your quiz result. Please try again.' } }

  try {
    const admin = createAdminClient()
    const [{ data: courses }, { data: programmes }] = await Promise.all([
      admin.from('courses').select('id, title, slug, category, duration, level, mode, summary, description, highlights, tools, outcomes, cover_image').eq('status', 'published').order('display_order'),
      admin.from('programmes').select('id, code, name').eq('status', 'active').order('display_order')
    ])
    const mapped = ((courses ?? []) as any[]).map((c) => ({ ...c, coverImage: c.cover_image, admissionStatus: 'open', relatedCourses: [], relatedInsights: [], featuredHome: false, controlsLoaded: false })) as Course[]
    const ranked = rankRecommendations(mapped, answers)
    const recommended = ranked.find((c) => c.slug === programmeId) ?? ranked[0]
    if (!recommended) return { status: 'error', message: 'We could not match your result to a current programme. Please try again.' }

    const normalEmail = email || `quiz-${crypto.randomUUID()}@lead.invalid`
    const normalPhone = phone || 'Not provided'
    let lead: { id: string; lead_reference: string } | null = null

    if (email || phone) {
      const existing = await findExistingLead(admin, { email: normalEmail, phone: normalPhone })
      if (existing) lead = { id: existing.id, lead_reference: existing.lead_reference }
    }

    const parts = name.split(/\s+/)
    if (!lead) {
      const leadReference = await generateLeadReference(admin)
      const { data, error } = await admin.from('leads').insert({
        lead_reference: leadReference,
        first_name: parts[0],
        last_name: parts.slice(1).join(' ') || '—',
        email: normalEmail,
        phone: normalPhone,
        status: 'new',
        source: 'career_quiz',
        landing_page: '/',
      }).select('id, lead_reference').single()
      if (error || !data) throw error || new Error('Lead creation failed')
      lead = data
    } else {
      await admin.from('leads').update({
        first_name: parts[0],
        last_name: parts.slice(1).join(' ') || '—',
        ...(email ? { email: email.toLowerCase() } : {}),
        ...(phone ? { phone } : {}),
        source: 'career_quiz'
      }).eq('id', lead.id)
    }

    const programmeCodeByCategory: Record<string, string> = { advanced_diploma: 'ADSE', smart_pro: 'SMARTPRO', acns: 'ACNS' }
    const crmProgramme = (programmes ?? []).find((p: any) => p.code === programmeCodeByCategory[(courses ?? []).find((c: any) => c.slug === recommended.slug)?.category || ''])
    const { error: interestError } = await admin.from('lead_interests').insert({ lead_id: lead.id, programme_id: crmProgramme?.id ?? null })
    if (interestError) console.error('[career-quiz] lead interest save failed', interestError)

    const secondary = ranked.find((c) => c.slug !== recommended.slug)
    const resultSummary = `Career interest: ${answers.interest}. Goal: ${answers.goal}. Experience: ${answers.experience}. Recommended: ${recommended.title}${secondary ? `. Secondary: ${secondary.title}.` : '.'}`
    const { error: resultError } = await admin.from('interactive_quiz_results').insert({
      lead_id: lead.id,
      answers,
      recommended_programme_id: crmProgramme?.id ?? null,
      secondary_programme_id: null,
      recommended_course_slug: recommended.slug,
      recommended_course_title: recommended.title,
      secondary_course_slug: secondary?.slug ?? null,
      secondary_course_title: secondary?.title ?? null,
      career_interest: answers.interest,
      goal: answers.goal,
      experience_level: answers.experience,
      result_summary: resultSummary
    })
    if (resultError) throw resultError

    await admin.from('interactions').insert({
      lead_id: lead.id,
      user_id: null,
      type: 'website',
      subject: 'Career discovery quiz completed',
      description: resultSummary
    })

    await Promise.allSettled([
      createNotification(admin, {
        type: 'lead.created',
        title: `Career quiz lead: ${name}`,
        body: `${programmeName || recommended.title} · ${answers.goal} · ${answers.experience}`,
        link: `/admin/leads/${lead.id}`,
        entity: 'lead',
        entityId: lead.id,
        targetRoles: ['admissions_officer', 'super_admin']
      })
    ])

    return { status: 'success', leadReference: lead.lead_reference }
  } catch (error) {
    console.error('[career-quiz] submit failed', error)
    return { status: 'error', message: 'We could not save your details right now. Please try again shortly.' }
  }
}
