import 'server-only'
import { requireStaff, ForbiddenError } from './auth'
import { hasPermission } from './permissions'
import type { Staff } from '../types/db'

/**
 * Who may manage workshops & events in the CRM.
 *  - Super Admin: everything, including deleting an event.
 *  - Admissions Officer: view, create, edit, export.
 *  - Content Manager: only what a Super Admin granted on the Enquiries module
 *    (enquiries.view / enquiries.edit / enquiries.export). Registrations hold
 *    personal data, so the Content Manager role alone grants nothing here.
 */
export type EventsAction = 'view' | 'create' | 'edit' | 'delete' | 'export'

const CONTENT_MANAGER_PERMISSION: Record<Exclude<EventsAction, 'delete'>, string> = {
  view: 'enquiries.view',
  create: 'enquiries.edit',
  edit: 'enquiries.edit',
  export: 'enquiries.export'
}

export function canDoEventsAction(staff: Pick<Staff, 'role' | 'permissions' | 'is_active'>, action: EventsAction): boolean {
  if (!staff.is_active) return false
  if (staff.role === 'super_admin') return true
  if (action === 'delete') return false
  if (staff.role === 'admissions_officer') return true
  if (staff.role === 'content_manager') return hasPermission(staff, CONTENT_MANAGER_PERMISSION[action])
  return false
}

export async function requireEventsAccess(action: EventsAction): Promise<Staff> {
  const staff = await requireStaff()
  if (!canDoEventsAction(staff, action)) throw new ForbiddenError()
  return staff
}
