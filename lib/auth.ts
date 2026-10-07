import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Staff, StaffRole, InsightContentType } from '../types/db'
import { hasPermission, hasAnyModulePermission } from './permissions'

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

/**
 * Coarse module gate, kept for backward compatibility with existing call
 * sites. A Content Manager now also passes the 'admissions' check if a
 * Super Admin has explicitly granted them any Enquiries/Applications/
 * Follow-ups permission (see lib/permissions.ts) — role alone still grants
 * nothing there, matching the "no automatic CRM access" requirement.
 */
export function canAccessModule(staff: Pick<Staff, 'role' | 'permissions'>, module: CrmModule): boolean {
  if (staff.role === 'super_admin') return true
  if (module === 'content') {
    return staff.role === 'content_manager' && (
      hasAnyModulePermission(staff, 'news') ||
      hasAnyModulePermission(staff, 'events') ||
      hasAnyModulePermission(staff, 'courses') ||
      hasAnyModulePermission(staff, 'media') ||
      hasAnyModulePermission(staff, 'faqs') ||
      hasAnyModulePermission(staff, 'website_content') ||
      hasAnyModulePermission(staff, 'campaigns')
    )
  }
  if (module === 'admissions') {
    return staff.role === 'admissions_officer' || (
      staff.role === 'content_manager' && (
        hasAnyModulePermission(staff, 'enquiries') ||
        hasAnyModulePermission(staff, 'applications') ||
        hasAnyModulePermission(staff, 'follow_ups')
      )
    )
  }
  return false
}

/**
 * Coarse path gate. Not currently wired into middleware (this project has
 * none — see the security audit notes in the implementation summary), so it
 * is not the real enforcement boundary; every data-fetch function below
 * enforces its own permission independently. Kept here, and extended, so it
 * stays accurate if middleware is added later.
 */
export function canAccessPath(staff: Pick<Staff, 'role' | 'permissions'>, pathname: string): boolean {
  if (staff.role === 'super_admin') return true
  // Every active staff member has their own notification inbox; what appears in it
  // is scoped by role / recipient (see lib/notifications.ts).
  if (pathname.startsWith('/admin/notifications')) return true
  if (staff.role === 'content_manager') {
    if (pathname === '/admin') return hasPermission(staff, 'dashboard_access')
    if (pathname.startsWith('/admin/insights')) return hasAnyModulePermission(staff, 'news') || hasAnyModulePermission(staff, 'events')
    if (pathname.startsWith('/admin/courses')) return hasAnyModulePermission(staff, 'courses')
    if (pathname.startsWith('/admin/gallery')) return hasAnyModulePermission(staff, 'media')
    if (pathname.startsWith('/admin/faqs')) return hasAnyModulePermission(staff, 'faqs')
    if (pathname.startsWith('/admin/settings')) return hasAnyModulePermission(staff, 'website_content')
    if (pathname.startsWith('/admin/campaigns')) return hasAnyModulePermission(staff, 'campaigns')
    if (pathname.startsWith('/admin/reports/seo')) return hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_seo_metrics')
    if (pathname.startsWith('/admin/reports')) return hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_reports')
    if (pathname.startsWith('/admin/leads')) return hasAnyModulePermission(staff, 'enquiries')
    if (pathname.startsWith('/admin/applications')) return hasAnyModulePermission(staff, 'applications')
    if (pathname.startsWith('/admin/follow-ups')) return hasAnyModulePermission(staff, 'follow_ups')
    return false
  }
  if (staff.role === 'admissions_officer') {
    return pathname === '/admin' || pathname.startsWith('/admin/leads') || pathname.startsWith('/admin/applications') || pathname.startsWith('/admin/follow-ups')
  }
  return false
}

/**
 * First page this staff member may open, in sidebar order. Used to land people
 * somewhere useful after login (and when /admin itself is not permitted for
 * them) instead of an access-denied page. /admin/notifications is open to every
 * active staff member, so this always returns a page that renders the menu.
 */
const LANDING_CANDIDATES = [
  '/admin',
  '/admin/leads',
  '/admin/applications',
  '/admin/follow-ups',
  '/admin/insights',
  '/admin/gallery',
  '/admin/courses',
  '/admin/faqs',
  '/admin/settings/social',
  '/admin/reports'
]

export function getLandingPath(staff: Pick<Staff, 'role' | 'permissions'>): string {
  for (const path of LANDING_CANDIDATES) {
    if (canAccessPath(staff, path)) return path
  }
  return '/admin/notifications'
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
  if (!canAccessModule(staff, module)) throw new ForbiddenError()
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

/**
 * These three helpers gate individual CRM actions. Historically Admissions
 * Officer / Super Admin only; now a Content Manager also passes if they hold
 * the matching granular permission for the relevant module (enquiries,
 * applications, or follow_ups) — see lib/permissions.ts. Callers that already
 * know which CRM module they're acting on should prefer requireCrmAction()
 * below, which enforces this same rule server-side before the mutation runs;
 * these remain for the existing UI-affordance call sites.
 */
export function canExportData(staff: Pick<Staff, 'role' | 'permissions'>) {
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return true
  return hasPermission(staff, 'enquiries.export') || hasPermission(staff, 'applications.export') || hasPermission(staff, 'follow_ups.export')
}

export function canAssignLeads(staff: Pick<Staff, 'role' | 'permissions'>) {
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return true
  return hasPermission(staff, 'enquiries.assign')
}

export function canEditLead(staff: Pick<Staff, 'role' | 'permissions'>) {
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return true
  return hasPermission(staff, 'enquiries.edit')
}

/**
 * The general-purpose CRM permission gate (spec section 3). Enforces:
 *   - Super Admin: always allowed.
 *   - Admissions Officer: unaffected, keeps full module access (their
 *     existing per-action nuance is the four can_* flags above, which are a
 *     separate, narrower concern within a module they can already reach).
 *   - Content Manager: allowed only if explicitly granted `${module}.${action}`.
 *     Holding the Content Manager role grants NONE of this by default.
 *   - Anyone else: denied.
 */
export async function requireCrmAction(module: CrmModule2, action: string): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, `${module}.${action}`)) return staff
  throw new ForbiddenError()
}

/**
 * Deletion in the CRM has always been Super Admin only, even for Admissions
 * Officer (see the original `requireRole('super_admin')` guards on
 * deleteLead/deleteApplication/deleteFollowUp — these delete cascades touch
 * a lot of related data). This migration does not change that for
 * Admissions Officer; it only adds the ability for a Super Admin to
 * additionally grant a specific Content Manager the matching `.delete`
 * permission, per spec section 3.
 */
export async function requireCrmDeleteAction(module: CrmModule2): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, `${module}.delete`)) return staff
  throw new ForbiddenError()
}

/**
 * Redirect-based guard for page-level (GET/direct-URL) access, used by
 * page.tsx files instead of letting a thrown Forbidden/UnauthorizedError
 * bubble up to the site's generic 500 error boundary (spec section 7 — a
 * manually-typed URL must get a real Access Denied response, not the
 * requested content and not a raw crash page). Usage:
 *
 *   const data = await guardPage(getLeads(filter))
 *
 * Wraps `redirect()` from next/navigation, which works by throwing — do not
 * catch the result of guardPage in a try/catch that also catches
 * ForbiddenError, or the redirect will be swallowed.
 */
export async function guardPage<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect('/admin/login')
    }
    if (err instanceof ForbiddenError) {
      redirect('/admin/access-denied')
    }
    throw err
  }
}

export type CrmModule2 = 'enquiries' | 'applications' | 'follow_ups'

// ----------------------------------------------------------------------------
// Granular Admissions Officer permissions (migration
// 0016_admissions_granular_permissions.sql). Super Admins always pass these
// checks regardless of the underlying flags — the flags exist purely so a
// Super Admin can selectively grant/revoke specific admissions actions for
// an individual Admissions Officer without changing their role. Every check
// still requires `requireAdmissionsAccess()` (module-level access) to have
// passed first; these only narrow what an Admissions Officer can do within
// that module.
// ----------------------------------------------------------------------------

type AdmissionsPermissionFlag =
  | 'can_update_lead_status'
  | 'can_log_interactions'
  | 'can_start_applications'
  | 'can_schedule_follow_ups'

function hasAdmissionsPermission(staff: Pick<Staff, 'role'> & Partial<Record<AdmissionsPermissionFlag, boolean>>, flag: AdmissionsPermissionFlag): boolean {
  if (staff.role === 'super_admin') return true
  if (staff.role !== 'admissions_officer') return false
  return Boolean(staff[flag])
}

/** Can update a lead's pipeline status (the "Pipeline status" control on a lead profile). */
export function canUpdateLeadStatus(staff: Pick<Staff, 'role' | 'can_update_lead_status'>) {
  return hasAdmissionsPermission(staff, 'can_update_lead_status')
}

/** Can log an interaction / add an entry to a lead's activity timeline. */
export function canLogInteractions(staff: Pick<Staff, 'role' | 'can_log_interactions'>) {
  return hasAdmissionsPermission(staff, 'can_log_interactions')
}

/** Can start (create) an application for a lead. */
export function canStartApplications(staff: Pick<Staff, 'role' | 'can_start_applications'>) {
  return hasAdmissionsPermission(staff, 'can_start_applications')
}

/** Can schedule a follow-up for a lead. */
export function canScheduleFollowUps(staff: Pick<Staff, 'role' | 'can_schedule_follow_ups'>) {
  return hasAdmissionsPermission(staff, 'can_schedule_follow_ups')
}

export function canManageProgrammes(role: StaffRole) {
  return role === 'super_admin'
}

// ----------------------------------------------------------------------------
// Granular Content Manager permissions (migration
// 0017_content_manager_granular_permissions.sql / lib/permissions.ts). Every
// content module below follows the same shape:
//   - canManageX(staff)      -> coarse "show the manage UI at all" check, used
//                                by pages/components that don't need a
//                                specific action.
//   - requireXAccess(action) -> server-side gate used by every data-fetch
//                                function and server action for that module.
//                                Defaults to 'view' so existing call sites
//                                that don't pass an action keep working.
// Super Admin always passes every check below regardless of the permissions
// map (spec section 13 — never locked out by a missing permission record).
// ----------------------------------------------------------------------------

export type ContentAction = 'view' | 'create' | 'edit' | 'publish' | 'unpublish' | 'delete' | 'upload' | 'replace'

async function requireContentModuleAction(module: string, action: ContentAction): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, `${module}.${action}`)) return staff
  throw new ForbiddenError()
}

/** Maps an Insight's content_type to the permission module that governs it. */
export function insightPermissionModule(contentType: InsightContentType | string): 'news' | 'events' {
  return contentType === 'event' ? 'events' : 'news'
}

/**
 * Insights (News/Blog/Insights + Events) are one underlying table
 * (migration 0004) but two independently-permissioned modules. When the
 * content type is known (editing/publishing/deleting a specific record, or
 * creating one from submitted form data), pass it so the correct module's
 * permission is checked. When it isn't known yet (viewing the combined
 * list), omit it — the caller (getInsights) is responsible for also
 * filtering rows to only the content types the caller may view; see
 * lib/crm/insights.ts.
 */
export async function requireInsightsAccess(contentType?: InsightContentType | string, action: ContentAction = 'view'): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (staff.role !== 'content_manager') throw new ForbiddenError()
  if (contentType !== undefined) {
    const module = insightPermissionModule(contentType)
    if (hasPermission(staff, `${module}.${action}`)) return staff
    throw new ForbiddenError()
  }
  // No specific content type: allow through if the Content Manager can view
  // at least one of the two insight modules. Row-level filtering happens
  // downstream in getInsights()/getInsightById().
  if (action === 'view' && (hasPermission(staff, 'news.view') || hasPermission(staff, 'events.view'))) return staff
  throw new ForbiddenError()
}

export function canManageInsights(staff: Pick<Staff, 'role' | 'permissions'>) {
  if (staff.role === 'super_admin') return true
  return staff.role === 'content_manager' && (hasPermission(staff, 'news.view') || hasPermission(staff, 'events.view'))
}

export function canManageCourses(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'courses.view'))
}
export async function requireCoursesAccess(action: ContentAction = 'view'): Promise<Staff> {
  return requireContentModuleAction('courses', action)
}

export function canManageGallery(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'media.view'))
}
export async function requireGalleryAccess(action: ContentAction = 'view'): Promise<Staff> {
  return requireContentModuleAction('media', action)
}

export function canManageFaqs(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'faqs.view'))
}
export async function requireFaqsAccess(action: ContentAction = 'view'): Promise<Staff> {
  return requireContentModuleAction('faqs', action)
}

/**
 * "Website content" covers the Settings sub-pages that aren't a distinct CMS
 * entity in this codebase: contact info, social links, and partners &
 * affiliated universities. Only view/edit are meaningful here (there's no
 * publish workflow or generic create/delete for a settings page).
 */
export function canManageSocialLinks(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'website_content.edit'))
}
export async function requireSocialLinksAccess(action: 'view' | 'edit' = 'edit'): Promise<Staff> {
  return requireContentModuleAction('website_content', action)
}
export function canManagePartners(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'website_content.edit'))
}
export async function requirePartnersAccess(action: 'view' | 'edit' = 'edit'): Promise<Staff> {
  return requireContentModuleAction('website_content', action)
}
export function canManageContactInfo(staff: Pick<Staff, 'role' | 'permissions'>) {
  return staff.role === 'super_admin' || (staff.role === 'content_manager' && hasPermission(staff, 'website_content.edit'))
}
export async function requireContactInfoAccess(action: 'view' | 'edit' = 'edit'): Promise<Staff> {
  return requireContentModuleAction('website_content', action)
}
/** Read access to the website-content settings pages (list/detail views). */
export async function requireWebsiteContentAccess(action: 'view' | 'edit' = 'view'): Promise<Staff> {
  return requireContentModuleAction('website_content', action)
}

// Testimonials are not part of the spec's permission catalog and remain
// Super Admin only, unchanged from before this migration.
export function canManageTestimonials(staff: Pick<Staff, 'role'>) { return staff.role === 'super_admin' }
export async function requireTestimonialsAccess(): Promise<Staff> { return requireRole('super_admin') }

/**
 * Admissions module gate (Enquiries/Applications/Follow-ups). Admissions
 * Officer keeps full, unconditional module access exactly as before. A
 * Content Manager now also passes if a Super Admin has explicitly granted
 * them view access to at least one of the three CRM modules — holding the
 * Content Manager role alone still grants nothing here (spec section 3).
 * Callers that need to gate a specific action (create/edit/delete/assign/
 * export/update_status/complete) within a specific module should use
 * requireCrmAction() from above instead.
 */
export async function requireAdmissionsAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return staff
  if (
    staff.role === 'content_manager' &&
    (hasPermission(staff, 'enquiries.view') || hasPermission(staff, 'applications.view') || hasPermission(staff, 'follow_ups.view'))
  ) {
    return staff
  }
  throw new ForbiddenError()
}

/**
 * Page-level guard for direct-URL access (spec section 7: a Content Manager
 * who manually types a URL they aren't authorized for must get a proper
 * Access Denied response, not the page's content). Use at the very top of a
 * Server Component page, before any data is fetched:
 *
 *   const staff = await guardAdminPage((s) => s.role === 'super_admin' || hasAnyModulePermission(s, 'media'))
 *
 * Redirects (not renders) to /admin/login or /admin/access-denied, so no
 * page content or data ever reaches the response for an unauthorized user.
 * This project has no middleware, so this guard — called from the page
 * itself — is the real enforcement boundary for whole-page access; every
 * data-fetch function still re-checks its own permission underneath, as
 * defense-in-depth.
 */
export async function guardAdminPage(check: (staff: Staff) => boolean): Promise<Staff> {
  const staff = await getCurrentStaff()
  if (!staff) redirect('/admin/login')
  if (!check(staff)) redirect('/admin/access-denied')
  return staff
}
