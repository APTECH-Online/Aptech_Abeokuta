'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireAdmissionsAccess, requireRole, canEditLead, canAssignLeads, ForbiddenError, UnauthorizedError } from '../../../../../lib/auth'
import { logAudit } from '../../../../../lib/audit'
import { generateApplicationReference } from '../../../../../lib/reference'
import {
  noteFormSchema,
  followUpFormSchema,
  leadEditSchema,
  formatZodErrors
} from '../../../../../lib/validation'
import { LEAD_STATUS_LABELS, type LeadStatus } from '../../../../../types/db'

export type ActionResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> }

function friendlyAuthError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: "You don't have permission to do that." }
  console.error('[crm] unexpected error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

export async function addInteraction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to add interactions." }

    const parsed = noteFormSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: 'Please fill in the required fields.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('interactions').insert({
      lead_id: parsed.data.leadId,
      user_id: staff.id,
      type: parsed.data.type,
      subject: parsed.data.subject || null,
      description: parsed.data.description
    })

    if (error) return { ok: false, message: 'Could not save that interaction.' }

    await logAudit(admin, {
      userId: staff.id,
      action: 'lead.interaction_logged',
      entity: 'lead',
      entityId: parsed.data.leadId,
      metadata: { type: parsed.data.type }
    })

    revalidatePath(`/admin/leads/${parsed.data.leadId}`)
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}

export async function changeLeadStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to change lead status." }

    const leadId = String(formData.get('leadId') || '')
    const newStatus = String(formData.get('status') || '') as LeadStatus
    if (!leadId || !newStatus) return { ok: false, message: 'Missing lead or status.' }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('leads').select('status').eq('id', leadId).maybeSingle()
    if (!existing) return { ok: false, message: 'Lead not found.' }

    const { error } = await admin.from('leads').update({ status: newStatus }).eq('id', leadId)
    if (error) return { ok: false, message: 'Could not update status.' }

    await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: staff.id,
      type: 'note',
      subject: 'Status changed',
      description: `Status changed from ${LEAD_STATUS_LABELS[existing.status as LeadStatus]} to ${LEAD_STATUS_LABELS[newStatus]}.`
    })

    await logAudit(admin, {
      userId: staff.id,
      action: 'lead.status_changed',
      entity: 'lead',
      entityId: leadId,
      metadata: { from: existing.status, to: newStatus }
    })

    revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin/leads')
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}

export async function assignLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canAssignLeads(staff.role)) return { ok: false, message: 'Only Admissions Officers or Super Admins can reassign leads.' }

    const leadId = String(formData.get('leadId') || '')
    const assignedTo = String(formData.get('assignedTo') || '') || null
    if (!leadId) return { ok: false, message: 'Missing lead.' }

    const admin = createAdminClient()
    const { error } = await admin.from('leads').update({ assigned_to: assignedTo }).eq('id', leadId)
    if (error) return { ok: false, message: 'Could not update assignment.' }

    let assignedName = 'Unassigned'
    if (assignedTo) {
      const { data: s } = await admin.from('staff').select('full_name').eq('id', assignedTo).maybeSingle()
      assignedName = s?.full_name ?? 'a staff member'
    }

    await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: staff.id,
      type: 'note',
      subject: 'Lead assigned',
      description: `Lead assigned to ${assignedName}.`
    })

    await logAudit(admin, {
      userId: staff.id,
      action: 'lead.assigned',
      entity: 'lead',
      entityId: leadId,
      metadata: { assignedTo }
    })

    revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin/leads')
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}

export async function scheduleFollowUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to schedule follow-ups." }

    const parsed = followUpFormSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: 'Please check the follow-up details.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('follow_ups').insert({
      lead_id: parsed.data.leadId,
      assigned_to: parsed.data.assignedTo || staff.id,
      due_date: new Date(parsed.data.dueDate).toISOString(),
      type: parsed.data.type,
      status: 'pending',
      notes: parsed.data.notes || null
    })

    if (error) return { ok: false, message: 'Could not schedule the follow-up.' }

    await admin.from('interactions').insert({
      lead_id: parsed.data.leadId,
      user_id: staff.id,
      type: 'note',
      subject: 'Follow-up scheduled',
      description: `Follow-up scheduled for ${new Date(parsed.data.dueDate).toLocaleDateString('en-GB')}.`
    })

    await logAudit(admin, {
      userId: staff.id,
      action: 'follow_up.created',
      entity: 'lead',
      entityId: parsed.data.leadId
    })

    revalidatePath(`/admin/leads/${parsed.data.leadId}`)
    revalidatePath('/admin/follow-ups')
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}

export async function updateFollowUpStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to update follow-ups." }

    const followUpId = String(formData.get('followUpId') || '')
    const status = String(formData.get('status') || '')
    const leadId = String(formData.get('leadId') || '')
    if (!followUpId || !status) return { ok: false, message: 'Missing follow-up.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('follow_ups')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', followUpId)

    if (error) return { ok: false, message: 'Could not update follow-up.' }

    await logAudit(admin, {
      userId: staff.id,
      action: 'follow_up.status_changed',
      entity: 'follow_up',
      entityId: followUpId,
      metadata: { status }
    })

    revalidatePath('/admin/follow-ups')
    if (leadId) revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}

export async function editLeadInfo(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to edit lead information." }

    const parsed = leadEditSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const admin = createAdminClient()
    const { leadId, ...rest } = parsed.data
    const { error } = await admin
      .from('leads')
      .update({
        first_name: rest.firstName,
        last_name: rest.lastName,
        email: rest.email,
        phone: rest.phone,
        whatsapp: rest.whatsapp || null,
        gender: rest.gender || null,
        address: rest.address || null,
        city: rest.city || null,
        state: rest.state || null,
        country: rest.country || null
      })
      .eq('id', leadId)

    if (error) return { ok: false, message: 'Could not save changes.' }

    await logAudit(admin, {
      userId: staff.id,
      action: 'lead.updated',
      entity: 'lead',
      entityId: leadId
    })

    revalidatePath(`/admin/leads/${leadId}`)
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}


export async function deleteLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const leadId = String(formData.get('leadId') || '')
    if (!leadId) return { ok: false, message: 'Missing enquiry.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('leads')
      .select('id, lead_reference, first_name, last_name')
      .eq('id', leadId)
      .maybeSingle()

    if (!existing) return { ok: false, message: 'Enquiry not found.' }

    // The database intentionally cascades this delete to the enquiry's
    // applications, follow-ups, interactions, education and interests.
    const { error } = await admin.from('leads').delete().eq('id', leadId)
    if (error) {
      console.error('[crm] failed to delete enquiry', error)
      return { ok: false, message: 'Could not delete the enquiry.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'lead.deleted',
      entity: 'lead',
      entityId: leadId,
      metadata: { leadReference: existing.lead_reference, name: `${existing.first_name} ${existing.last_name}` }
    })

    revalidatePath('/admin/leads')
    revalidatePath('/admin/applications')
    revalidatePath('/admin/follow-ups')
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
    if (err instanceof ForbiddenError) return { ok: false, message: "Only Super Admins can delete enquiries." }
    console.error('[crm] unexpected error deleting enquiry', err)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}


export async function deleteFollowUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const followUpId = String(formData.get('followUpId') || '')
    if (!followUpId) return { ok: false, message: 'Missing follow-up.' }

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('follow_ups')
      .select('id, lead_id')
      .eq('id', followUpId)
      .maybeSingle()

    if (!existing) return { ok: false, message: 'Follow-up not found.' }

    const { error } = await admin.from('follow_ups').delete().eq('id', followUpId)
    if (error) {
      console.error('[crm] failed to delete follow-up', error)
      return { ok: false, message: 'Could not delete the follow-up.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'follow_up.deleted',
      entity: 'follow_up',
      entityId: followUpId,
      metadata: { leadId: existing.lead_id }
    })

    revalidatePath('/admin/follow-ups')
    revalidatePath(`/admin/leads/${existing.lead_id}`)
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
    if (err instanceof ForbiddenError) return { ok: false, message: "Only Super Admins can delete follow-ups." }
    console.error('[crm] unexpected error deleting follow-up', err)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}

export async function startApplication(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireAdmissionsAccess()
    if (!canEditLead(staff.role)) return { ok: false, message: "You don't have permission to start an application." }

    const leadId = String(formData.get('leadId') || '')
    const programmeId = String(formData.get('programmeId') || '')
    if (!leadId || !programmeId) return { ok: false, message: 'Select a programme first.' }

    const admin = createAdminClient()

    // --- Duplicate prevention ---------------------------------------------
    // A lead moving from enquiry to application should get one active
    // application per programme, not a new row every time someone clicks
    // "Start application" (double submissions, page refreshes, etc). An
    // application that was withdrawn or rejected doesn't block a fresh one —
    // the applicant may legitimately re-apply.
    const { data: existingApplication } = await admin
      .from('applications')
      .select('id, application_reference, status')
      .eq('lead_id', leadId)
      .eq('programme_id', programmeId)
      .not('status', 'in', '(withdrawn,rejected)')
      .maybeSingle()

    if (existingApplication) {
      return {
        ok: false,
        message: `This applicant already has an active application (${existingApplication.application_reference}) for that programme.`
      }
    }

    const reference = await generateApplicationReference(admin)

    const { error } = await admin.from('applications').insert({
      application_reference: reference,
      lead_id: leadId,
      programme_id: programmeId,
      status: 'submitted',
      assigned_to: staff.id
    })

    if (error) {
      // A unique-violation here (Postgres code 23505) means a concurrent
      // request created the same lead+programme application a moment ago —
      // treat it the same as the pre-check above rather than a hard failure.
      if ((error as { code?: string }).code === '23505') {
        return { ok: false, message: 'This applicant already has an active application for that programme.' }
      }
      return { ok: false, message: 'Could not create the application.' }
    }

    await admin.from('leads').update({ status: 'application_submitted' }).eq('id', leadId)

    await admin.from('interactions').insert({
      lead_id: leadId,
      user_id: staff.id,
      type: 'note',
      subject: 'Application started',
      description: `Application ${reference} created.`
    })

    await logAudit(admin, {
      userId: staff.id,
      action: 'application.created',
      entity: 'application',
      entityId: reference,
      metadata: { leadId, programmeId }
    })

    revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin/applications')
    return { ok: true }
  } catch (err) {
    return friendlyAuthError(err)
  }
}
