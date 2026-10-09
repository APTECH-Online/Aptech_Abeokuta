'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireCrmAction, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'

const RULES = ['programme_page_viewed', 'programme_interest', 'career_quiz_completed', 'fee_inquiry', 'consultation_booked', 'application_completed'] as const

export async function saveLeadScoringRules(formData: FormData) {
  try {
    const staff = await requireCrmAction('enquiries', 'update_status')
    const high = Number(formData.get('highThreshold'))
    const medium = Number(formData.get('mediumThreshold'))
    if (!Number.isInteger(high) || !Number.isInteger(medium) || high < 1 || high > 1000 || medium < 0 || medium >= high) {
      redirect('/admin/lead-scoring?error=thresholds')
    }
    const admin = createAdminClient()
    for (const eventName of RULES) {
      const points = Number(formData.get(`points_${eventName}`))
      const maxOccurrences = Number(formData.get(`max_${eventName}`))
      if (!Number.isInteger(points) || points < 0 || points > 100 || !Number.isInteger(maxOccurrences) || maxOccurrences < 1 || maxOccurrences > 20) {
        redirect('/admin/lead-scoring?error=rules')
      }
      const { error } = await admin.from('lead_scoring_rules').update({
        points, max_occurrences: maxOccurrences,
        enabled: formData.get(`enabled_${eventName}`) === 'on', updated_at: new Date().toISOString()
      }).eq('event_name', eventName)
      if (error) throw error
    }
    const { error: settingsError } = await admin.from('lead_scoring_settings').upsert({ id: 1, high_threshold: high, medium_threshold: medium, updated_at: new Date().toISOString() })
    if (settingsError) throw settingsError
    const { error: recalculateError } = await admin.rpc('recalculate_all_intelligent_lead_scores')
    if (recalculateError) throw recalculateError
    await logAudit(admin, { userId: staff.id, action: 'lead_scoring.rules_updated', entity: 'lead_scoring_rules', metadata: { highThreshold: high, mediumThreshold: medium } })
    revalidatePath('/admin/lead-scoring')
    revalidatePath('/admin/leads')
    redirect('/admin/lead-scoring?saved=1')
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error
    if (error instanceof UnauthorizedError) redirect('/admin/login')
    if (error instanceof ForbiddenError) redirect('/admin/access-denied')
    console.error('[lead-scoring] failed to save scoring configuration', error)
    redirect('/admin/lead-scoring?error=save')
  }
}
