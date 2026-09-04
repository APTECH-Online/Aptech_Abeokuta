'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireRole, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { z } from 'zod'
import type { StaffRole } from '../../../../types/db'

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string }

const inviteSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(['super_admin', 'admissions_manager', 'admissions_officer', 'counsellor', 'viewer'])
})

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: 'Only Super Admins can manage staff accounts.' }
  console.error('[crm] unexpected staff error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

export async function inviteStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')

    const parsed = inviteSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || 'Please check the form.' }
    }

    const admin = createAdminClient()

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email)

    if (inviteError || !invited?.user) {
      console.error('[crm] failed to invite staff member', inviteError)
      return {
        ok: false,
        message:
          "Couldn't send an invite email (email delivery may not be configured on this Supabase project). " +
          'You can still create the user manually in Supabase Auth, then add them as staff using the SQL in supabase/seed.sql.'
      }
    }

    const { error: staffError } = await admin.from('staff').insert({
      id: invited.user.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      role: parsed.data.role,
      is_active: true
    })

    if (staffError) {
      return { ok: false, message: 'User was invited, but could not be added as staff. Contact a developer.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'staff.invited',
      entity: 'staff',
      entityId: invited.user.id,
      metadata: { role: parsed.data.role }
    })

    revalidatePath('/admin/staff')
    return { ok: true, message: `Invitation sent to ${parsed.data.email}.` }
  } catch (err) {
    return authError(err)
  }
}

export async function updateStaffRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    const role = String(formData.get('role') || '') as StaffRole
    if (!staffId || !role) return { ok: false, message: 'Missing staff member or role.' }

    if (staffId === staff.id && role !== 'super_admin') {
      return { ok: false, message: "You can't remove your own Super Admin access." }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('staff').update({ role }).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not update role.' }

    await logAudit(admin, { userId: staff.id, action: 'staff.role_changed', entity: 'staff', entityId: staffId, metadata: { role } })

    revalidatePath('/admin/staff')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}

export async function toggleStaffActive(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    const nextActive = formData.get('nextActive') === 'true'
    if (!staffId) return { ok: false, message: 'Missing staff member.' }

    if (staffId === staff.id && !nextActive) {
      return { ok: false, message: "You can't deactivate your own account." }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('staff').update({ is_active: nextActive }).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not update staff status.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextActive ? 'staff.activated' : 'staff.deactivated',
      entity: 'staff',
      entityId: staffId
    })

    revalidatePath('/admin/staff')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
