'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireRole, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'
import { sanitizePermissionsInput, diffPermissions, getDefaultContentManagerPermissions, type PermissionMap } from '../../../../lib/permissions'
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
      is_active: true,
      // A brand-new Content Manager starts with the suggested defaults
      // (spec section 11) — full News/Events/Media, everything else denied.
      // Super Admin can adjust immediately from the Staff page.
      ...(parsed.data.role === 'content_manager' ? { permissions: getDefaultContentManagerPermissions() } : {})
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
    const update: Record<string, unknown> = { role }
    if (role === 'content_manager') {
      // Newly-promoted Content Managers start from the suggested defaults if
      // they don't already have a permission set (e.g. a returning CM).
      const { data: existing } = await admin.from('staff').select('permissions').eq('id', staffId).maybeSingle()
      const current = (existing?.permissions ?? {}) as PermissionMap
      if (Object.keys(current).length === 0) update.permissions = getDefaultContentManagerPermissions()
    }
    const { error } = await admin.from('staff').update(update).eq('id', staffId)
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
    const { data: staffRecord, error: staffLookupError } = await admin
      .from('staff')
      .select('id, email, is_active')
      .eq('id', parsed.data.staffId)
      .maybeSingle()

    if (staffLookupError || !staffRecord) {
      return { ok: false, message: 'Could not find that staff account.' }
    }

    if (!staffRecord.is_active) {
      return { ok: false, message: 'Cannot reset the password for an inactive staff account.' }
    }

    // Legacy staff accounts may have been created through the old invitation
    // flow and can therefore have an unconfirmed Auth email. Keep Auth and
    // the CRM staff record aligned while resetting the credential so the
    // existing Work Email + new password can sign in immediately.
    const { data: authUser, error: authLookupError } = await admin.auth.admin.getUserById(parsed.data.staffId)
    if (authLookupError || !authUser?.user) {
      console.error('[crm] failed to find staff auth account', authLookupError)
      return { ok: false, message: 'No authentication account is linked to this staff member.' }
    }

    const { error } = await admin.auth.admin.updateUserById(parsed.data.staffId, {
      email: staffRecord.email.toLowerCase(),
      email_confirm: true,
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
 * Grants or revokes the four granular Admissions Officer permissions
 * (update lead status, log interactions, start applications, schedule
 * follow-ups) for one staff member — see migration
 * 0016_admissions_granular_permissions.sql. Deliberately separate from
 * updateStaffRole: this narrows what an Admissions Officer can do within
 * the Admissions module, it never changes which modules they can reach.
 * Super Admin access is never affected by these flags, so this action
 * refuses to touch any staff member who isn't an Admissions Officer.
 */
export async function updateAdmissionsPermissions(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    if (!staffId) return { ok: false, message: 'Missing staff member.' }

    const admin = createAdminClient()
    const { data: target } = await admin.from('staff').select('id, role').eq('id', staffId).maybeSingle()
    if (!target) return { ok: false, message: 'Staff member not found.' }
    if (target.role !== 'admissions_officer') {
      return { ok: false, message: 'These permissions only apply to the Admissions Officer role.' }
    }

    const updates = {
      can_update_lead_status: formData.get('can_update_lead_status') === 'on',
      can_log_interactions: formData.get('can_log_interactions') === 'on',
      can_start_applications: formData.get('can_start_applications') === 'on',
      can_schedule_follow_ups: formData.get('can_schedule_follow_ups') === 'on'
    }

    const { error } = await admin.from('staff').update(updates).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not update permissions.' }

    await logAudit(admin, {
      userId: staff.id,
      action: 'staff.admissions_permissions_updated',
      entity: 'staff',
      entityId: staffId,
      metadata: updates
    })

    revalidatePath('/admin/staff')
    return { ok: true, message: 'Permissions saved.' }
  } catch (err) {
    return authError(err)
  }
}

/**
 * Saves the full granular permission set for one Content Manager (spec
 * sections 2, 3, 4, 6). Only ever touches `staff.permissions` — it never
 * changes role, so it can't be used to widen a Content Manager into
 * Enquiries/Applications/Follow-ups by accident: every key here still comes
 * from the fixed, centrally-defined catalog in lib/permissions.ts, and
 * sanitizePermissionsInput() drops anything that isn't a known key before it
 * ever reaches the database (spec section 14 — no permission escalation via
 * a crafted form submission).
 */
export async function updateContentManagerPermissions(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const actingStaff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    if (!staffId) return { ok: false, message: 'Missing staff member.' }

    const admin = createAdminClient()
    const { data: target } = await admin.from('staff').select('id, role, permissions').eq('id', staffId).maybeSingle()
    if (!target) return { ok: false, message: 'Staff member not found.' }
    if (target.role !== 'content_manager') {
      return { ok: false, message: 'Granular permissions only apply to the Content Manager role.' }
    }

    const raw: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) raw[key] = value
    const nextPermissions = sanitizePermissionsInput(raw)
    const previousPermissions = (target.permissions ?? {}) as PermissionMap

    const { error } = await admin.from('staff').update({ permissions: nextPermissions }).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not update permissions.' }

    const changed = diffPermissions(previousPermissions, nextPermissions)
    await logAudit(admin, {
      userId: actingStaff.id,
      action: 'staff.content_manager_permissions_updated',
      entity: 'staff',
      entityId: staffId,
      metadata: {
        changedKeys: Object.keys(changed),
        changes: changed,
        previousPermissions,
        newPermissions: nextPermissions
      }
    })

    revalidatePath('/admin/staff')
    return { ok: true, message: 'Permissions saved.' }
  } catch (err) {
    return authError(err)
  }
}

/** Resets a Content Manager back to the suggested defaults (spec section 11). */
export async function resetContentManagerPermissionsToDefault(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const actingStaff = await requireRole('super_admin')
    const staffId = String(formData.get('staffId') || '')
    if (!staffId) return { ok: false, message: 'Missing staff member.' }

    const admin = createAdminClient()
    const { data: target } = await admin.from('staff').select('id, role, permissions').eq('id', staffId).maybeSingle()
    if (!target) return { ok: false, message: 'Staff member not found.' }
    if (target.role !== 'content_manager') {
      return { ok: false, message: 'Granular permissions only apply to the Content Manager role.' }
    }

    const previousPermissions = (target.permissions ?? {}) as PermissionMap
    const defaults = getDefaultContentManagerPermissions()

    const { error } = await admin.from('staff').update({ permissions: defaults }).eq('id', staffId)
    if (error) return { ok: false, message: 'Could not reset permissions.' }

    const changed = diffPermissions(previousPermissions, defaults)
    await logAudit(admin, {
      userId: actingStaff.id,
      action: 'staff.content_manager_permissions_reset_to_default',
      entity: 'staff',
      entityId: staffId,
      metadata: { changedKeys: Object.keys(changed), changes: changed, previousPermissions, newPermissions: defaults }
    })

    revalidatePath('/admin/staff')
    return { ok: true, message: 'Permissions reset to default.' }
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
