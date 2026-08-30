'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireStaff, canManageProgrammes, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { programmeFormSchema, formatZodErrors } from '../../../../lib/validation'

export type ActionResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: 'Only Super Admins and Admissions Managers can manage programmes.' }
  console.error('[crm] unexpected programme error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

export async function createProgramme(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    if (!canManageProgrammes(staff.role)) return { ok: false, message: 'Only Super Admins and Admissions Managers can manage programmes.' }

    const parsed = programmeFormSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: formatZodErrors(parsed.error) }
    }

    const admin = createAdminClient()
    const { data: maxOrder } = await admin
      .from('programmes')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error } = await admin.from('programmes').insert({
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      description: parsed.data.description || null,
      duration: parsed.data.duration || null,
      status: parsed.data.status,
      display_order: (maxOrder?.display_order ?? 0) + 1
    })

    if (error) {
      if (error.code === '23505') return { ok: false, message: 'A programme with that code already exists.', fieldErrors: { code: 'Code already in use' } }
      return { ok: false, message: 'Could not create the programme.' }
    }

    await logAudit(admin, { userId: staff.id, action: 'programme.created', entity: 'programme', metadata: { code: parsed.data.code } })

    revalidatePath('/admin/programmes')
    revalidatePath('/admissions')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function updateProgramme(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    if (!canManageProgrammes(staff.role)) return { ok: false, message: 'Only Super Admins and Admissions Managers can manage programmes.' }

    const programmeId = String(formData.get('programmeId') || '')
    const parsed = programmeFormSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: formatZodErrors(parsed.error) }
    }
    if (!programmeId) return { ok: false, message: 'Missing programme.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('programmes')
      .update({
        name: parsed.data.name,
        code: parsed.data.code.toUpperCase(),
        description: parsed.data.description || null,
        duration: parsed.data.duration || null,
        status: parsed.data.status
      })
      .eq('id', programmeId)

    if (error) {
      if (error.code === '23505') return { ok: false, message: 'A programme with that code already exists.', fieldErrors: { code: 'Code already in use' } }
      return { ok: false, message: 'Could not update the programme.' }
    }

    await logAudit(admin, { userId: staff.id, action: 'programme.updated', entity: 'programme', entityId: programmeId })

    revalidatePath('/admin/programmes')
    revalidatePath('/admissions')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleProgrammeStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    if (!canManageProgrammes(staff.role)) return { ok: false, message: 'Only Super Admins and Admissions Managers can manage programmes.' }

    const programmeId = String(formData.get('programmeId') || '')
    const nextStatus = String(formData.get('nextStatus') || '')
    if (!programmeId || (nextStatus !== 'active' && nextStatus !== 'inactive')) {
      return { ok: false, message: 'Invalid request.' }
    }

    const admin = createAdminClient()
    // Deactivating a programme only hides it from new public applications —
    // historical lead_interests/applications rows keep their programme_id
    // reference (foreign key uses ON DELETE SET NULL, never a delete here).
    const { error } = await admin.from('programmes').update({ status: nextStatus }).eq('id', programmeId)
    if (error) return { ok: false, message: 'Could not update programme status.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextStatus === 'active' ? 'programme.activated' : 'programme.deactivated',
      entity: 'programme',
      entityId: programmeId
    })

    revalidatePath('/admin/programmes')
    revalidatePath('/admissions')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
