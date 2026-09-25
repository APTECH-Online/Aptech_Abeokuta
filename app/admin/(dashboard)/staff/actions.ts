'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireRole, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { z } from 'zod'
import type { StaffRole } from '../../../../types/db'

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string }

const staffPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be 128 characters or fewer.')

const createStaffSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    role: z.enum(['super_admin', 'content_manager', 'admissions_officer']),
    password: staffPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm the password.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  })

const resetStaffPasswordSchema = z
  .object({
    staffId: z.string().uuid('Invalid staff member.'),
    password: staffPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm the password.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  })

function authError(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: 'Only Super Admins can manage staff accounts.' }
  console.error('[crm] unexpected staff error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

export async function createStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')

    const parsed = createStaffSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || 'Please check the form.' }
    }

    const email = parsed.data.email.toLowerCase()
    const admin = createAdminClient()

    // Staff rows are intentionally 1:1 with Supabase Auth users (staff.id =
    // auth.users.id). Create the real authentication credential first; no
    // invitation or email onboarding is involved in this flow.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true
    })

    if (createError || !created?.user) {
      console.error('[crm] failed to create staff auth account', createError)
      return {
        ok: false,
        message: createError?.message?.toLowerCase().includes('already')
          ? 'An authentication account with this email already exists.'
          : 'Could not create the authentication account.'
      }
    }

    const { error: staffError } = await admin.from('staff').insert({
      id: created.user.id,
      full_name: parsed.data.fullName,
      email,
      role: parsed.data.role,
      is_active: true
    })

    if (staffError) {
      // Never leave an orphaned auth user if the corresponding CRM staff row
      // cannot be created.
      await admin.auth.admin.deleteUser(created.user.id)
      console.error('[crm] failed to create staff profile; auth user removed', staffError)
      return { ok: false, message: 'Could not create the staff profile. No account was created.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'staff.created',
      entity: 'staff',
      entityId: created.user.id,
      metadata: { role: parsed.data.role }
    })

    revalidatePath('/admin/staff')
    return { ok: true, message: `Staff account created for ${email}.` }
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


export async function resetStaffPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')

    const parsed = resetStaffPasswordSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || 'Please check the form.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(parsed.data.staffId, {
      password: parsed.data.password
    })
    if (error) {
      console.error('[crm] failed to reset staff password', error)
      return { ok: false, message: 'Could not reset the password.' }
    }

    await logAudit(admin, {
      userId: staff.id,
      action: 'staff.password_reset',
      entity: 'staff',
      entityId: parsed.data.staffId
    })
    return { ok: true, message: 'Password reset successfully.' }
  } catch (err) {
    return authError(err)
  }
}

/**
 * Grants or revokes access to the Insights & Events CMS. Deliberately
 * separate from updateStaffRole above: this is the granular permission
 * described in migration 0004_insights.sql, not a role change, so it can't
 * accidentally widen access to leads, applications or staff management.
 */
export async function toggleInsightsPermission(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    const nextValue = formData.get('nextValue') === 'true'
    if (!staffId) return { ok: false, message: 'Missing staff member.' }

    const admin = createAdminClient()
    const { error } = await admin.from('staff').update({ can_manage_insights: nextValue }).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not update Insights access.' }

    await logAudit(admin, {
      userId: staff.id,
      action: nextValue ? 'staff.insights_access_granted' : 'staff.insights_access_revoked',
      entity: 'staff',
      entityId: staffId
    })

    revalidatePath('/admin/staff')
    return { ok: true }
  } catch (err) {
    return authError(err)
  }
}
