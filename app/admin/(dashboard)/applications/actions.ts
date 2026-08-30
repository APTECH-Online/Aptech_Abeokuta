'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireStaff, canEditLead, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '../../../../types/db'

export type ActionResult = { ok: true } | { ok: false; message: string }

export async function updateApplicationStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to update applications." }

    const applicationId = String(formData.get('applicationId') || '')
    const status = String(formData.get('status') || '') as ApplicationStatus
    const leadId = String(formData.get('leadId') || '')
    if (!applicationId || !status) return { ok: false, message: 'Missing application or status.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('applications').select('status').eq('id', applicationId).maybeSingle()
    if (!existing) return { ok: false, message: 'Application not found.' }

    const { error } = await admin
      .from('applications')
      .update({
        status,
        reviewed_at: ['accepted', 'rejected', 'under_review'].includes(status) ? new Date().toISOString() : null
      })
      .eq('id', applicationId)

    if (error) return { ok: false, message: 'Could not update the application.' }

    if (status === 'enrolled' && leadId) {
      await admin.from('leads').update({ status: 'enrolled' }).eq('id', leadId)
    }
    if (status === 'accepted' && leadId) {
      await admin.from('leads').update({ status: 'admission_offered' }).eq('id', leadId)
    }

    if (leadId) {
      await admin.from('interactions').insert({
        lead_id: leadId,
        user_id: staff.id,
        type: 'note',
        subject: 'Application status updated',
        description: `Application status changed from ${APPLICATION_STATUS_LABELS[existing.status as ApplicationStatus]} to ${APPLICATION_STATUS_LABELS[status]}.`
      })
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'application.status_changed',
      entity: 'application',
      entityId: applicationId,
      metadata: { from: existing.status, to: status }
    })

    revalidatePath('/admin/applications')
    if (leadId) revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
    if (err instanceof ForbiddenError) return { ok: false, message: "You don't have permission to do that." }
    console.error('[crm] unexpected error updating application', err)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
