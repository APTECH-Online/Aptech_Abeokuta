import 'server-only'
import { createClient } from './supabase/server'
import type { Staff, StaffRole } from '../types/db'

export class UnauthorizedError extends Error {
  constructor(message = 'You must be signed in to do that.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Resolves both whether there's a Supabase session at all, and (if so)
 * whether it maps to an active staff row. Used by the protected layout to
 * distinguish "not signed in" (→ redirect to login) from "signed in but not
 * provisioned as staff" (→ show an access-pending message rather than a
 * redirect loop).
 */
export async function getSessionAndStaff(): Promise<{ hasSession: boolean; staff: Staff | null }> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return { hasSession: false, staff: null }

  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return { hasSession: true, staff: (data as Staff) ?? null }
}

/**
 * Resolves the signed-in Supabase user (if any) to their `staff` row.
 * Returns null if there's no session, or if the session doesn't correspond
 * to an active staff account.
 */
export async function getCurrentStaff(): Promise<Staff | null> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null
  return data as Staff
}

/** Throws if there is no signed-in, active staff member. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff()
  if (!staff) throw new UnauthorizedError()
  return staff
}

// Simple role hierarchy used for permission checks across the CRM.
const ROLE_RANK: Record<StaffRole, number> = {
  viewer: 0,
  counsellor: 1,
  admissions_officer: 2,
  admissions_manager: 3,
  super_admin: 4
}

/** Throws unless the current staff member's role is >= the given role. */
export async function requireRole(minRole: StaffRole): Promise<Staff> {
  const staff = await requireStaff()
  if (ROLE_RANK[staff.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError()
  }
  return staff
}

/** Throws unless the current staff member's role is one of the given roles. */
export async function requireAnyRole(roles: StaffRole[]): Promise<Staff> {
  const staff = await requireStaff()
  if (!roles.includes(staff.role)) {
    throw new ForbiddenError()
  }
  return staff
}

export function canManageProgrammes(role: StaffRole) {
  return role === 'super_admin' || role === 'admissions_manager'
}

export function canManageStaff(role: StaffRole) {
  return role === 'super_admin'
}

export function canExportData(role: StaffRole) {
  return role !== 'viewer'
}

export function canAssignLeads(role: StaffRole) {
  return role === 'super_admin' || role === 'admissions_manager'
}

export function canEditLead(role: StaffRole) {
  return role !== 'viewer'
}
