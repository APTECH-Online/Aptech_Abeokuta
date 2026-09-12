import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { createNotification } from '../../../../lib/notifications'
import { logAudit } from '../../../../lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Scheduled reminders for overdue follow-ups.
 *
 * `follow_ups.reminder_sent_at` was added in migration 0003 for an email
 * reminder job that was never built. This project has no configured email
 * provider (see lib/email/send.ts), so this repurposes that same column for
 * an in-app reminder instead — the meaning is unchanged ("has a reminder
 * already gone out for this follow-up?"), only the delivery channel is: a
 * notification on /admin/notifications rather than an email.
 *
 * What it does, every run:
 *   1. Finds `pending` follow-ups whose due_date has passed and that have
 *      never had a reminder raised.
 *   2. Creates one notification per follow-up, addressed to whoever it's
 *      assigned to (or broadcast to admissions staff if unassigned).
 *   3. Stamps reminder_sent_at so the same follow-up isn't re-notified on
 *      every subsequent run — staff can already see it under Follow-ups.
 */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed if not configured
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}

async function runFollowUpReminders() {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: overdue, error } = await admin
    .from('follow_ups')
    .select('id, lead_id, assigned_to, due_date, type, leads(first_name, last_name)')
    .eq('status', 'pending')
    .is('reminder_sent_at', null)
    .lte('due_date', nowIso)

  if (error) {
    throw new Error(`Failed to look up overdue follow-ups: ${error.message}`)
  }

  let notifiedCount = 0

  for (const followUp of overdue ?? []) {
    const lead = (followUp as any).leads as { first_name?: string; last_name?: string } | null
    const leadName = lead ? `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() : 'a lead'

    await createNotification(admin, {
      type: 'followup.overdue',
      title: `Follow-up overdue: ${leadName || 'a lead'}`,
      body: `This ${followUp.type} follow-up was due ${new Date(followUp.due_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}.`,
      link: `/admin/leads/${followUp.lead_id}`,
      entity: 'follow_up',
      entityId: followUp.id,
      recipientId: followUp.assigned_to,
      targetRoles: followUp.assigned_to ? null : ['admissions_officer', 'admissions_manager', 'super_admin']
    })

    await admin.from('follow_ups').update({ reminder_sent_at: nowIso }).eq('id', followUp.id)
    notifiedCount += 1
  }

  if (notifiedCount > 0) {
    await logAudit(admin, {
      action: 'followup.reminder_raised',
      entity: 'follow_up',
      metadata: { count: notifiedCount, trigger: 'cron' }
    })
  }

  return { notifiedCount }
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runFollowUpReminders()
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() })
  } catch (err) {
    console.error('[cron] follow-up-reminders failed', err)
    return NextResponse.json({ ok: false, error: 'Follow-up reminders failed. Check server logs.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
