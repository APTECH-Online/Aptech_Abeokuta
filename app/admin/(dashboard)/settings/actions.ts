'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireRole, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import type { StaffRole } from '../../../../types/db'

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string }

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: 'Only Super Admins can manage staff accounts.' }
  console.error('[crm] unexpected staff error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
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

    revalidatePath('/admin/settings')
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

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
