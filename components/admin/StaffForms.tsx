'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import {
  createStaffMember,
  updateStaffRole,
  toggleStaffActive,
  resetStaffPassword,
  updateAdmissionsPermissions,
  updateContentManagerPermissions,
  resetContentManagerPermissionsToDefault,
  type ActionResult
} from '../../app/admin/(dashboard)/staff/actions'
import { STAFF_ROLE_LABELS, type Staff, type StaffRole } from '../../types/db'
import {
  CONTENT_PERMISSION_CATALOG,
  CRM_PERMISSION_CATALOG,
  DASHBOARD_PERMISSION_CATALOG,
  hasAnyModulePermission,
  type PermissionModuleDef
} from '../../lib/permissions'

const initial: ActionResult = { ok: true }
const ROLES: StaffRole[] = ['super_admin', 'content_manager', 'admissions_officer']

const ADMISSIONS_PERMISSION_FIELDS: { key: keyof Pick<Staff, 'can_update_lead_status' | 'can_log_interactions' | 'can_start_applications' | 'can_schedule_follow_ups'>; label: string }[] = [
  { key: 'can_update_lead_status', label: 'Update pipeline status' },
  { key: 'can_log_interactions', label: 'Add to timeline' },
  { key: 'can_start_applications', label: 'Start application' },
  { key: 'can_schedule_follow_ups', label: 'Schedule follow-up' }
]

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className="btn btn-primary btn-sm disabled:opacity-60">{pending ? 'Working…' : children}</button>
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--color-muted)' }}>No admissions actions granted</span>
  }
  return <div className="flex flex-wrap gap-1.5">{items.map((p) => <span key={p} className="text-xs rounded-full px-2 py-1" style={{ background: 'var(--color-navy-50)', color: 'var(--color-ink)' }}>{p}</span>)}</div>
}

function PermissionSummary({ member }: { member: Staff }) {
  if (member.role === 'super_admin') return <Chips items={['All modules', 'All CRUD', 'Staff & settings']} />
  if (member.role === 'content_manager') {
    const granted = ALL_MODULE_DEFS.filter((def) => hasAnyModulePermission(member, def.module)).map((def) => def.label)
    return <Chips items={granted} />
  }
  if (member.role === 'admissions_officer') {
    return <Chips items={ADMISSIONS_PERMISSION_FIELDS.filter((f) => member[f.key]).map((f) => f.label)} />
  }
  return <Chips items={[]} />
}

/**
 * The four granular Admissions Officer permissions from migration
 * 0016_admissions_granular_permissions.sql, checkable/uncheckable per staff
 * member. Super Admin always has full access regardless of these boxes —
 * unchecking one here only ever narrows what this specific Admissions
 * Officer can do; it never affects Super Admins or other staff.
 */
function AdmissionsPermissionsForm({ member }: { member: Staff }) {
  const [state, formAction] = useActionState(updateAdmissionsPermissions, initial)
  useActionFeedback(state, 'Permissions saved successfully.')

  return (
    <form action={formAction} className="grid gap-2.5">
      <input type="hidden" name="staffId" value={member.id} />
      {ADMISSIONS_PERMISSION_FIELDS.map((f) => (
        <label key={f.key} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-body)' }}>
          <input type="checkbox" name={f.key} defaultChecked={member[f.key]} className="accent-[var(--color-navy-700)]" />
          {f.label}
        </label>
      ))}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <SubmitButton>Save permissions</SubmitButton>
        {!state.ok && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
        {state.ok && state.message && <p className="text-xs" style={{ color: 'var(--color-success)' }}>{state.message}</p>}
      </div>
    </form>
  )
}

const ALL_MODULE_DEFS: PermissionModuleDef[] = [...CONTENT_PERMISSION_CATALOG, ...CRM_PERMISSION_CATALOG]

/**
 * Full granular Content Manager permission editor (spec section 6):
 *   Admin -> Staff -> Content Manager -> Permissions
 * Renders itself entirely from the shared catalog in lib/permissions.ts so
 * this UI can never list a permission the server doesn't also know about.
 * Bulk actions (Select All / Clear All / per-module Select/Clear) operate
 * directly on the checkboxes in the DOM rather than duplicating checkbox
 * state in React — the checkboxes themselves are the source of truth that
 * gets submitted as FormData when the form is saved.
 */
function ContentManagerPermissionsForm({ member }: { member: Staff }) {
  const [saveState, saveAction] = useActionState(updateContentManagerPermissions, initial)
  useActionFeedback(saveState, 'Permissions saved successfully.')
  const [resetState, resetAction] = useActionState(resetContentManagerPermissionsToDefault, initial)
  useActionFeedback(resetState, 'Permissions reset to default.')
  const formRef = useRef<HTMLFormElement>(null)

  function setAll(value: boolean) {
    const form = formRef.current
    if (!form) return
    form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-permission-key]').forEach((el) => {
      el.checked = value
    })
  }

  function setModule(def: PermissionModuleDef, value: boolean) {
    const form = formRef.current
    if (!form) return
    for (const action of def.actions) {
      const el = form.querySelector<HTMLInputElement>(`input[name="${def.module}.${action.key}"]`)
      if (el) el.checked = value
    }
  }

  function handleSaveSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const checkedCount = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-permission-key]:checked').length
    const totalCount = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-permission-key]').length
    const message =
      checkedCount === 0
        ? `Save with every permission removed? ${member.full_name} will lose all Content Manager access.`
        : checkedCount === totalCount
          ? `Grant ${member.full_name} every available permission?`
          : `Save these permission changes for ${member.full_name}?`
    if (!window.confirm(message)) e.preventDefault()
  }

  function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Reset ${member.full_name} to the default Content Manager permissions? This discards any custom grants.`)) {
      e.preventDefault()
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <button type="button" onClick={() => setAll(true)} className="btn btn-ghost btn-sm">Select all</button>
        <button type="button" onClick={() => setAll(false)} className="btn btn-ghost btn-sm">Clear all</button>
      </div>

      <form ref={formRef} action={saveAction} onSubmit={handleSaveSubmit} className="grid gap-4">
        <input type="hidden" name="staffId" value={member.id} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted)' }}>CMS</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {CONTENT_PERMISSION_CATALOG.map((def) => (
              <fieldset key={def.module} className="rounded-md border p-2.5" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
                <div className="flex items-center justify-between gap-2">
                  <legend className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{def.label}</legend>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setModule(def, true)} className="text-[0.65rem] underline" style={{ color: 'var(--color-muted)' }}>all</button>
                    <button type="button" onClick={() => setModule(def, false)} className="text-[0.65rem] underline" style={{ color: 'var(--color-muted)' }}>none</button>
                  </div>
                </div>
                <div className="grid gap-1 mt-1.5">
                  {def.actions.map((a) => {
                    const key = `${def.module}.${a.key}`
                    return (
                      <label key={key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-body)' }}>
                        <input type="checkbox" name={key} data-permission-key defaultChecked={member.permissions?.[key] === true} className="accent-[var(--color-navy-700)]" />
                        {a.label}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted)' }}>
            CRM <span className="normal-case font-normal">— not granted by the Content Manager role by default</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {CRM_PERMISSION_CATALOG.map((def) => (
              <fieldset key={def.module} className="rounded-md border p-2.5" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
                <div className="flex items-center justify-between gap-2">
                  <legend className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{def.label}</legend>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setModule(def, true)} className="text-[0.65rem] underline" style={{ color: 'var(--color-muted)' }}>all</button>
                    <button type="button" onClick={() => setModule(def, false)} className="text-[0.65rem] underline" style={{ color: 'var(--color-muted)' }}>none</button>
                  </div>
                </div>
                <div className="grid gap-1 mt-1.5">
                  {def.actions.map((a) => {
                    const key = `${def.module}.${a.key}`
                    return (
                      <label key={key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-body)' }}>
                        <input type="checkbox" name={key} data-permission-key defaultChecked={member.permissions?.[key] === true} className="accent-[var(--color-navy-700)]" />
                        {a.label}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted)' }}>Dashboard &amp; reports</p>
          <div className="grid sm:grid-cols-2 gap-1.5 rounded-md border p-2.5" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
            {DASHBOARD_PERMISSION_CATALOG.map((d) => (
              <label key={d.key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-body)' }}>
                <input type="checkbox" name={d.key} data-permission-key defaultChecked={member.permissions?.[d.key] === true} className="accent-[var(--color-navy-700)]" />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SubmitButton>Save permissions</SubmitButton>
          {!saveState.ok && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{saveState.message}</p>}
          {saveState.ok && saveState.message && <p className="text-xs" style={{ color: 'var(--color-success)' }}>{saveState.message}</p>}
        </div>
      </form>

      <form action={resetAction} onSubmit={handleResetSubmit} className="mt-2">
        <input type="hidden" name="staffId" value={member.id} />
        <button type="submit" className="btn btn-ghost btn-sm">Reset to default</button>
        {!resetState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{resetState.message}</p>}
      </form>
    </div>
  )
}

export function AddStaffForm() {
  const [state, formAction] = useActionState(createStaffMember, initial)
  useActionFeedback(state, 'Create staff member completed successfully.')
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && state.message) formRef.current?.reset()
  }, [state])

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary btn-sm">Add Staff</button>

  return (
    <form ref={formRef} action={formAction} className="card p-5 sm:p-6 grid gap-4 w-full">
      <p className="eyebrow">Add staff account</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label htmlFor="fullName" className="field-label">Full name</label><input id="fullName" name="fullName" required className="field-input" /></div>
        <div><label htmlFor="email" className="field-label">Work email</label><input id="email" name="email" type="email" required className="field-input" autoComplete="off" /></div>
      </div>
      <div>
        <label htmlFor="role" className="field-label">Role</label>
        <select id="role" name="role" defaultValue="admissions_officer" className="field-select">
          {ROLES.map((r) => <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="staffPassword" className="field-label">Password</label>
          <input id="staffPassword" name="password" type="password" minLength={8} maxLength={128} required className="field-input" autoComplete="new-password" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="staffConfirmPassword" className="field-label">Confirm password</label>
          <input id="staffConfirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} required className="field-input" autoComplete="new-password" />
        </div>
      </div>
      {!state.ok ? <FormAlert variant="error" title="Couldn't create staff account"><p>{state.message}</p></FormAlert> : state.message ? <FormAlert variant="success" title="Staff account created"><p>{state.message}</p></FormAlert> : null}
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No invitation email is sent. Provide the initial credentials to the staff member through your organization&apos;s secure method.</p>
      <div className="flex gap-2"><SubmitButton>Create account</SubmitButton><button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Close</button></div>
    </form>
  )
}

/** Role select + save, shared by the table row and the mobile card. */
function RoleForm({ member, isSelf }: { member: Staff; isSelf: boolean }) {
  const [roleState, roleAction] = useActionState(updateStaffRole, initial)
  useActionFeedback(roleState, 'Update staff role completed successfully.')

  return (
    <div>
      <form action={roleAction} className="admin-role-form">
        <input type="hidden" name="staffId" value={member.id} />
        <select name="role" defaultValue={member.role} className="admin-select" disabled={isSelf}>
          {ROLES.map((r) => <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>)}
        </select>
        {!isSelf && <SubmitButton>Save</SubmitButton>}
      </form>
      {!roleState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{roleState.message}</p>}
    </div>
  )
}

/**
 * Active/inactive status. `showBadge` is off in the mobile card, which
 * already surfaces the status pill up in the card header.
 */
function AccessControl({ member, isSelf, showBadge = true }: { member: Staff; isSelf: boolean; showBadge?: boolean }) {
  const [activeState, activeAction] = useActionState(toggleStaffActive, initial)
  useActionFeedback(activeState, 'Toggle staff active completed successfully.')

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showBadge && <StatusBadge status={member.is_active ? 'active' : 'inactive'} label={member.is_active ? 'Active' : 'Inactive'} />}
      <form action={activeAction}>
        <input type="hidden" name="staffId" value={member.id} />
        <input type="hidden" name="nextActive" value={(!member.is_active).toString()} />
        <button type="submit" disabled={isSelf} className="btn btn-ghost btn-sm disabled:opacity-40">
          {member.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </form>
      {!activeState.ok && <p className="text-xs w-full" style={{ color: 'var(--color-danger)' }}>{activeState.message}</p>}
    </div>
  )
}

function ResetPasswordControl({ member }: { member: Staff }) {
  const [passwordState, passwordAction] = useActionState(resetStaffPassword, initial)
  useActionFeedback(passwordState, 'Reset staff password completed successfully.')
  const [resetOpen, setResetOpen] = useState(false)
  const resetFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (passwordState.ok && passwordState.message) resetFormRef.current?.reset()
  }, [passwordState])

  return (
    <div>
      <button type="button" onClick={() => setResetOpen((v) => !v)} className="btn btn-ghost btn-sm">Reset Password</button>
      {resetOpen && (
        <form ref={resetFormRef} action={passwordAction} className="mt-2 grid gap-2 max-w-xs">
          <input type="hidden" name="staffId" value={member.id} />
          <input name="password" type="password" minLength={8} maxLength={128} required placeholder="New password" autoComplete="new-password" className="field-input" />
          <input name="confirmPassword" type="password" minLength={8} maxLength={128} required placeholder="Confirm new password" autoComplete="new-password" className="field-input" />
          <SubmitButton>Set password</SubmitButton>
        </form>
      )}
      {passwordState.message && <p className="text-xs mt-1" style={{ color: passwordState.ok ? 'var(--color-success)' : 'var(--color-danger)' }}>{passwordState.message}</p>}
    </div>
  )
}

/**
 * Permission summary chips + "Manage Permissions" button. Selecting the
 * button now opens the editor in a Modal overlay rather than expanding
 * inline, so a long checkbox list can never stretch or distort the table
 * row it's triggered from.
 */
function PermissionsControl({ member }: { member: Staff }) {
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const roleLabel = STAFF_ROLE_LABELS[member.role] ?? member.role

  return (
    <div>
      <PermissionSummary member={member} />
      <button type="button" onClick={() => setPermissionsOpen(true)} className="btn btn-ghost btn-sm mt-2">Manage Permissions</button>

      <Modal
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        title={`Manage permissions — ${member.full_name}`}
        description={`${roleLabel} role`}
        size={member.role === 'content_manager' ? 'lg' : 'sm'}
      >
        {member.role === 'admissions_officer' ? (
          <AdmissionsPermissionsForm member={member} />
        ) : member.role === 'content_manager' ? (
          <ContentManagerPermissionsForm member={member} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Super Admins always have full access to every module and cannot be restricted.
          </p>
        )}
      </Modal>
    </div>
  )
}

export function StaffRow({ member, isSelf }: { member: Staff; isSelf: boolean }) {
  return (
    <tr>
      <td className="font-medium" style={{ color: 'var(--color-ink)' }}>{member.full_name}{isSelf && ' (you)'}</td>
      <td>{member.email}</td>
      <td><RoleForm member={member} isSelf={isSelf} /></td>
      <td><PermissionsControl member={member} /></td>
      <td><AccessControl member={member} isSelf={isSelf} /></td>
      <td><ResetPasswordControl member={member} /></td>
    </tr>
  )
}

/**
 * Mobile/narrow-viewport counterpart to StaffRow, shown below the md
 * breakpoint in place of the table (see .staff-cards in app/globals.css).
 * Same underlying data and server actions, laid out as a stacked card so
 * nothing gets cramped or clipped on small screens.
 */
export function StaffCard({ member, isSelf }: { member: Staff; isSelf: boolean }) {
  return (
    <div className="staff-card">
      <div className="staff-card__head">
        <div className="min-w-0">
          <p className="staff-card__name">{member.full_name}{isSelf && ' (you)'}</p>
          <p className="staff-card__email">{member.email}</p>
        </div>
        <StatusBadge status={member.is_active ? 'active' : 'inactive'} label={member.is_active ? 'Active' : 'Inactive'} />
      </div>

      <div className="staff-card__row">
        <span className="staff-card__label">Role</span>
        <RoleForm member={member} isSelf={isSelf} />
      </div>

      <div className="staff-card__row">
        <span className="staff-card__label">Assigned permissions</span>
        <PermissionsControl member={member} />
      </div>

      <div className="staff-card__row">
        <span className="staff-card__label">Access</span>
        <AccessControl member={member} isSelf={isSelf} showBadge={false} />
      </div>

      <div className="staff-card__row">
        <span className="staff-card__label">Password</span>
        <ResetPasswordControl member={member} />
      </div>
    </div>
  )
}
