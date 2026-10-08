import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { checkRateLimit } from '../../../../lib/rate-limit'

const ALLOWED = new Set([
  'career_quiz_started',
  'career_quiz_recommendation_viewed',
  'career_quiz_completed',
  'tech_challenge_started',
  'tech_challenge_completed',
  'comparison_started',
  'comparison_programme_added',
  'comparison_programme_removed',
  'comparison_completed',
  'comparison_cta_clicked',
  'career_pathway_viewed',
  'student_story_viewed',
  'student_project_viewed',
  'advisor_cta_clicked',
  'enquiry_cta_clicked',
  'application_cta_clicked',
  'campaign_landing_viewed',
  'campaign_cta_clicked',
  'tech_zone_viewed',
  'challenge_started',
  'challenge_completed',
  'challenge_result_viewed',
  'challenge_lead_captured',
  'challenge_cta_clicked',
  'challenge_whatsapp_clicked',
  'playground_viewed',
  'playground_activity_started',
  'playground_activity_completed',
  'playground_cta_clicked',
  'playground_share_clicked',
  'playground_badge_earned',
  'playground_leaderboard_name_set',
  'playground_lead_captured'
])

export async function POST(request: Request) {
  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
    const limit = checkRateLimit(`analytics-event:${ip}`)
    if (!limit.allowed) return NextResponse.json({ ok: false }, { status: 429 })
    const body = await request.json().catch(() => null) as { event?: unknown; leadId?: unknown; metadata?: unknown; sessionId?: unknown } | null
    const event = typeof body?.event === 'string' ? body.event : ''
    if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 })
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}
    const leadId = typeof body?.leadId === 'string' ? body.leadId : null
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 120) : null
    const admin = createAdminClient()
    const { error } = await admin.from('conversion_events').insert({ event_name: event, lead_id: leadId, session_id: sessionId, metadata })
    if (error) return NextResponse.json({ ok: false }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
