// Intentionally NOT 'server-only': this module is pure data + pure functions
// (no secrets, no DB access) and is imported from both server code (lib/auth.ts,
// server actions) and client components (the permission-editor checkboxes in
// components/admin/StaffForms.tsx render themselves from this same catalog so
// the UI can never drift from what the server actually enforces).
import type { Staff } from '../types/db'

/**
 * Single source of truth for every Content Manager permission in the CRM.
 *
 * Permission keys are plain strings shaped `"<module>.<action>"` (or, for the
 * dashboard toggles, a flat key with no dot) and are stored verbatim as the
 * keys of the `staff.permissions` JSONB column (migration
 * 0017_content_manager_granular_permissions.sql). Keeping the catalog here —
 * instead of hard-coding permission strings throughout the app — means:
 *   - the Permission management UI (components/admin/StaffForms.tsx) can
 *     render itself from this list instead of a hand-maintained checkbox tree,
 *   - every server action/data-fetch function checks the same key names,
 *   - adding a new permission is a one-line change in this file.
 *
 * IMPORTANT: this system only ever narrows a Content Manager. Super Admin is
 * always fully authorized (see hasPermission below) and Admissions Officer
 * access is governed entirely by its own, pre-existing mechanism (role +
 * the four can_* columns from migration 0016) — untouched by this file.
 */

export type ContentModule = 'news' | 'events' | 'courses' | 'media' | 'faqs' | 'website_content'
export type CrmModule = 'enquiries' | 'applications' | 'follow_ups'

export interface PermissionActionDef {
  key: string
  label: string
}

export interface PermissionModuleDef {
  module: string
  label: string
  description?: string
  actions: PermissionActionDef[]
}

const VIEW: PermissionActionDef = { key: 'view', label: 'View' }
const CREATE: PermissionActionDef = { key: 'create', label: 'Create' }
const EDIT: PermissionActionDef = { key: 'edit', label: 'Edit' }
const PUBLISH: PermissionActionDef = { key: 'publish', label: 'Publish' }
const UNPUBLISH: PermissionActionDef = { key: 'unpublish', label: 'Unpublish' }
const DELETE: PermissionActionDef = { key: 'delete', label: 'Delete' }

/** CMS / content permissions (spec section 2). */
export const CONTENT_PERMISSION_CATALOG: PermissionModuleDef[] = [
  {
    module: 'news',
    label: 'News / Blog / Insights',
    description: 'Insights records that are not tagged as an Event.',
    actions: [VIEW, CREATE, EDIT, PUBLISH, UNPUBLISH, DELETE]
  },
  {
    module: 'events',
    label: 'Events',
    description: 'Insights records tagged with content type "Event".',
    actions: [VIEW, CREATE, EDIT, PUBLISH, UNPUBLISH, DELETE]
  },
  {
    module: 'courses',
    label: 'Programs / Courses',
    description: 'The public course catalogue (/admin/courses).',
    actions: [VIEW, CREATE, EDIT, PUBLISH, UNPUBLISH, DELETE]
  },
  {
    module: 'website_content',
    label: 'Website content (Settings)',
    description: 'Contact info, social links, and partners/alliances pages.',
    actions: [VIEW, EDIT]
  },
  {
    module: 'faqs',
    label: 'FAQs',
    actions: [VIEW, CREATE, EDIT, DELETE]
  },
  {
    module: 'media',
    label: 'Media / Images / Files',
    description: 'The public photo gallery.',
    actions: [VIEW, { key: 'upload', label: 'Upload' }, { key: 'replace', label: 'Replace' }, DELETE]
  }
]

/** CRM permissions (spec section 3). Denied by default for Content Managers. */
export const CRM_PERMISSION_CATALOG: PermissionModuleDef[] = [
  {
    module: 'enquiries',
    label: 'Enquiries',
    actions: [VIEW, CREATE, EDIT, DELETE, { key: 'assign', label: 'Assign' }, { key: 'export', label: 'Export' }]
  },
  {
    module: 'applications',
    label: 'Applications',
    actions: [
      VIEW,
      CREATE,
      EDIT,
      DELETE,
      { key: 'assign', label: 'Assign' },
      { key: 'update_status', label: 'Update status' },
      { key: 'export', label: 'Export' }
    ]
  },
  {
    module: 'follow_ups',
    label: 'Follow-ups',
    actions: [
      VIEW,
      CREATE,
      EDIT,
      DELETE,
      { key: 'assign', label: 'Assign' },
      { key: 'complete', label: 'Complete/close' },
      { key: 'export', label: 'Export' }
    ]
  }
]

/** Dashboard/reporting toggles (spec section 4). Flat keys, no module prefix. */
export const DASHBOARD_PERMISSION_CATALOG: PermissionActionDef[] = [
  { key: 'dashboard_access', label: 'Access the dashboard' },
  { key: 'dashboard_view_content_stats', label: 'View content statistics' },
  { key: 'dashboard_view_crm_stats', label: 'View CRM statistics' },
  { key: 'dashboard_view_admissions_stats', label: 'View admissions statistics' },
  { key: 'dashboard_view_reports', label: 'View reports' },
  { key: 'dashboard_export_reports', label: 'Export reports' }
]

function moduleKeys(def: PermissionModuleDef): string[] {
  return def.actions.map((a) => `${def.module}.${a.key}`)
}

/** Every permission key that can legally appear in `staff.permissions`. */
export const ALL_PERMISSION_KEYS: string[] = [
  ...CONTENT_PERMISSION_CATALOG.flatMap(moduleKeys),
  ...CRM_PERMISSION_CATALOG.flatMap(moduleKeys),
  ...DASHBOARD_PERMISSION_CATALOG.map((d) => d.key)
]

const ALL_PERMISSION_KEY_SET = new Set(ALL_PERMISSION_KEYS)

export type PermissionMap = Record<string, boolean>

/**
 * Suggested defaults for a brand-new Content Manager (spec section 11):
 * full News/Events/Media access, everything else denied. Super Admin can
 * change these at any time per staff member — this is only the starting
 * point used by "Add Staff" and "Reset to Default".
 */
export function getDefaultContentManagerPermissions(): PermissionMap {
  const defaults: PermissionMap = {}
  for (const key of ALL_PERMISSION_KEYS) defaults[key] = false
  for (const module of ['news', 'events', 'media']) {
    for (const key of ALL_PERMISSION_KEYS) {
      if (key.startsWith(`${module}.`)) defaults[key] = true
    }
  }
  return defaults
}

/**
 * The authorization check. Mirrors staff_has_permission() in migration 0017
 * so the database (RLS) and application layers never disagree:
 *   - Super Admin: always true. A Super Admin can never be accidentally
 *     locked out by a missing/blank permissions map (spec section 13).
 *   - Content Manager: looks up the flat permissions map (missing key = false).
 *   - Anyone else: false. This system does not grant Admissions Officers (or
 *     any other role) anything — their access is unaffected.
 */
export function hasPermission(staff: Pick<Staff, 'role' | 'permissions'>, key: string): boolean {
  if (staff.role === 'super_admin') return true
  if (staff.role !== 'content_manager') return false
  return staff.permissions?.[key] === true
}

/** True if the Content Manager can perform ANY action within a module (used for nav visibility). */
export function hasAnyModulePermission(staff: Pick<Staff, 'role' | 'permissions'>, module: string): boolean {
  if (staff.role === 'super_admin') return true
  if (staff.role !== 'content_manager') return false
  return Object.entries(staff.permissions ?? {}).some(([key, value]) => value === true && key.startsWith(`${module}.`))
}

/**
 * Validates and coerces an arbitrary object (e.g. parsed form data) into a
 * safe PermissionMap containing only known keys with strict boolean values.
 * Unknown keys are silently dropped so a crafted request can't inject
 * arbitrary keys into the JSONB column.
 */
export function sanitizePermissionsInput(input: Record<string, unknown>): PermissionMap {
  const clean: PermissionMap = {}
  for (const key of ALL_PERMISSION_KEYS) {
    clean[key] = input[key] === true || input[key] === 'true' || input[key] === 'on'
  }
  return clean
}

export function isKnownPermissionKey(key: string): boolean {
  return ALL_PERMISSION_KEY_SET.has(key)
}

/** Produces a readable diff of changed keys only, for audit logging (spec section 16). */
export function diffPermissions(before: PermissionMap, after: PermissionMap): Record<string, { from: boolean; to: boolean }> {
  const diff: Record<string, { from: boolean; to: boolean }> = {}
  for (const key of ALL_PERMISSION_KEYS) {
    const from = before?.[key] === true
    const to = after?.[key] === true
    if (from !== to) diff[key] = { from, to }
  }
  return diff
}
