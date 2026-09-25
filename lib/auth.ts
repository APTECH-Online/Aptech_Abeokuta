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

export type CrmModule = 'content' | 'admissions' | 'staff' | 'admin'

export function canAccessModule(role: StaffRole, module: CrmModule): boolean {
  if (role === 'super_admin') return true
  if (module === 'content') return role === 'content_manager'
  if (module === 'admissions') return role === 'admissions_officer'
  return false
}

export function canAccessPath(role: StaffRole, pathname: string): boolean {
  if (role === 'super_admin') return true
  if (role === 'content_manager') {
    return pathname === '/admin' || pathname.startsWith('/admin/insights')
  }
  if (role === 'admissions_officer') {
    return pathname === '/admin' || pathname.startsWith('/admin/leads') || pathname.startsWith('/admin/applications') || pathname.startsWith('/admin/follow-ups')
  }
  return false
}

/** Resolves the signed-in Supabase user to an active CRM staff row. */
export async function getSessionAndStaff(): Promise<{ hasSession: boolean; staff: Staff | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasSession: false, staff: null }

  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return { hasSession: true, staff: (data as Staff) ?? null }
}

export async function getCurrentStaff(): Promise<Staff | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff()
  if (!staff) throw new UnauthorizedError()
  return staff
}

export async function requireModuleAccess(module: CrmModule): Promise<Staff> {
  const staff = await requireStaff()
  if (!canAccessModule(staff.role, module)) throw new ForbiddenError()
  return staff
}

export async function requireRole(minRole: StaffRole): Promise<Staff> {
  const staff = await requireStaff()
  if (minRole === 'super_admin' && staff.role !== 'super_admin') throw new ForbiddenError()
  return staff
}

export async function requireAnyRole(roles: StaffRole[]): Promise<Staff> {
  const staff = await requireStaff()
  if (!roles.includes(staff.role)) throw new ForbiddenError()
  return staff
}

export function canManageStaff(role: StaffRole) {
  return role === 'super_admin'
}

export function canExportData(role: StaffRole) {
  return role === 'super_admin' || role === 'admissions_officer'
}

export function canAssignLeads(role: StaffRole) {
  return role === 'super_admin' || role === 'admissions_officer'
}

export function canEditLead(role: StaffRole) {
  return role === 'super_admin' || role === 'admissions_officer'
}

export function canManageProgrammes(role: StaffRole) {
  return role === 'super_admin'
}

export function canManageInsights(staff: Pick<Staff, 'role'>) {
  return staff.role === 'super_admin' || staff.role === 'content_manager'
}

export async function requireInsightsAccess(): Promise<Staff> {
  return requireModuleAccess('content')
}

// These legacy content helpers remain for existing pages/actions, but the new
// RBAC deliberately restricts those modules to Super Admin. Content Manager
// access is limited to News/Blog/Insights (the existing CMS is /admin/insights).
export function canManageGallery(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireGalleryAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManageTestimonials(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireTestimonialsAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManageFaqs(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireFaqsAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManageCourses(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireCoursesAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManageSocialLinks(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireSocialLinksAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManagePartners(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requirePartnersAccess(): Promise<Staff> { return requireRole('super_admin') }
export function canManageContactInfo(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireContactInfoAccess(): Promise<Staff> { return requireRole('super_admin') }

export async function requireAdmissionsAccess(): Promise<Staff> {
  return requireModuleAccess('admissions')
}
