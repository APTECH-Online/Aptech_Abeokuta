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

/**
 * Content-management permission for the Insights & Events module. This is
 * intentionally NOT folded into the `role` hierarchy above: several of the
 * helpers in this file (canEditLead, canExportData) grant access to anyone
 * whose role isn't 'viewer', which would be the wrong behaviour for a
 * permission meant only to unlock Insights. super_admin always has access;
 * everyone else needs the explicit `can_manage_insights` flag on their
 * staff row (see migration 0004_insights.sql).
 */
export function canManageInsights(staff: Pick<Staff, 'role' | 'can_manage_insights'>) {
  return staff.role === 'super_admin' || staff.can_manage_insights === true
}

/** Throws unless the current staff member can manage Insights content. */
export async function requireInsightsAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (!canManageInsights(staff)) {
    throw new ForbiddenError('You need Content Manager access to do that. Ask a Super Admin to grant it in Staff settings.')
  }
  return staff
}

/**
 * The Gallery module reuses the same `can_manage_insights` flag rather than
 * adding a second content-permission column: both modules are "Content
 * Manager" work in practice (the Insights error message above already
 * describes it that way to staff, not as "Insights access" specifically),
 * and a staff member trusted to publish articles is the same person you'd
 * trust to publish photos. If the two ever need to diverge, split this into
 * its own `can_manage_gallery` column then.
 */
export function canManageGallery(staff: Pick<Staff, 'role' | 'can_manage_insights'>) {
  return canManageInsights(staff)
}

/** Throws unless the current staff member can manage Gallery content. */
export async function requireGalleryAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (!canManageGallery(staff)) {
    throw new ForbiddenError('You need Content Manager access to do that. Ask a Super Admin to grant it in Staff settings.')
  }
  return staff
}

/** Same reuse rationale as canManageGallery above. */
export function canManageTestimonials(staff: Pick<Staff, 'role' | 'can_manage_insights'>) {
  return canManageInsights(staff)
}

export async function requireTestimonialsAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (!canManageTestimonials(staff)) {
    throw new ForbiddenError('You need Content Manager access to do that. Ask a Super Admin to grant it in Staff settings.')
  }
  return staff
}

/** Same reuse rationale as canManageGallery above. */
export function canManageFaqs(staff: Pick<Staff, 'role' | 'can_manage_insights'>) {
  return canManageInsights(staff)
}

export async function requireFaqsAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (!canManageFaqs(staff)) {
    throw new ForbiddenError('You need Content Manager access to do that. Ask a Super Admin to grant it in Staff settings.')
  }
  return staff
}

/**
 * Same reasoning as canManageGallery above: the Course catalogue is also
 * Content Manager work, so it reuses the same `can_manage_insights` flag
 * rather than a fourth permission column.
 */
export function canManageCourses(staff: Pick<Staff, 'role' | 'can_manage_insights'>) {
  return canManageInsights(staff)
}

/** Throws unless the current staff member can manage the Course catalogue. */
export async function requireCoursesAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (!canManageCourses(staff)) {
    throw new ForbiddenError('You need Content Manager access to do that. Ask a Super Admin to grant it in Staff settings.')
  }
  return staff
}
