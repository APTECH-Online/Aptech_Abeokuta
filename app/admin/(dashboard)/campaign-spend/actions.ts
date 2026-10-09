'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaff, ForbiddenError } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/admin'

export async function saveCampaignSpend(formData: FormData) {
  const staff = await requireStaff()
  if (!['super_admin', 'admissions_officer'].includes(staff.role)) throw new ForbiddenError()
  const campaignId = String(formData.get('campaign_id') || '')
  const spendDate = String(formData.get('spend_date') || '')
  const amount = Number(formData.get('amount'))
  const currency = String(formData.get('currency') || 'NGN').toUpperCase()
  const sourceNote = String(formData.get('source_note') || '').trim().slice(0, 500)
  if (!campaignId || !/^\d{4}-\d{2}-\d{2}$/.test(spendDate) || !Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency)) {
    redirect('/admin/campaign-spend?error=invalid')
  }
  const admin = createAdminClient()
  const { error } = await admin.from('campaign_spend').upsert({ campaign_id: campaignId, spend_date: spendDate, amount, currency, source_note: sourceNote || null, created_by: staff.id }, { onConflict: 'campaign_id,spend_date,currency' })
  if (error) {
    console.error('[campaign-spend] save failed', error)
    redirect('/admin/campaign-spend?error=save')
  }
  revalidatePath('/admin/campaign-spend')
  revalidatePath('/admin/reports')
  redirect('/admin/campaign-spend?saved=1')
}
