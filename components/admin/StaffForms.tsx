'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useActionFeedback } from './AdminFeedbackProvider'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { createStaffMember, updateStaffRole, toggleStaffActive, resetStaffPassword, updateAdmissionsPermissions, type ActionResult } from '../../app/admin/(dashboard)/staff/actions'
import { STAFF_ROLE_LABELS, type Staff, type StaffRole } from '../../types/db'

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
  if (member.role === 'content_manager') return <Chips items={['News', 'Blog', 'Insights']} />
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
    <form action={formAction} className="mt-3 grid gap-2 p-3 rounded-lg max-w-xs" style={{ background: 'var(--color-paper)' }}>
      <input type="hidden" name="staffId" value={member.id} />
      <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Admissions permissions</p>
      {ADMISSIONS_PERMISSION_FIELDS.map((f) => (
        <label key={f.key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-body)' }}>
          <input type="checkbox" name={f.key} defaultChecked={member[f.key]} className="accent-[var(--color-navy-700)]" />
          {f.label}
        </label>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <SubmitButton>Save permissions</SubmitButton>
      </div>
      {!state.ok && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
      {state.ok && state.message && <p className="text-xs" style={{ color: 'var(--color-success)' }}>{state.message}</p>}
    </form>
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

export function StaffRow({ member, isSelf }: { member: Staff; isSelf: boolean }) {
  const [roleState, roleAction] = useActionState(updateStaffRole, initial)
  useActionFeedback(roleState, 'Update staff role completed successfully.')
  const [activeState, activeAction] = useActionState(toggleStaffActive, initial)
  useActionFeedback(activeState, 'Toggle staff active completed successfully.')
  const [passwordState, passwordAction] = useActionState(resetStaffPassword, initial)
  useActionFeedback(passwordState, 'Reset staff password completed successfully.')
  const [resetOpen, setResetOpen] = useState(false)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const resetFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (passwordState.ok && passwordState.message) resetFormRef.current?.reset()
  }, [passwordState])

  return (
    <tr>
      <td className="font-medium" style={{ color: 'var(--color-ink)' }}>{member.full_name}{isSelf && ' (you)'}</td>
      <td>{member.email}</td>
      <td>
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="staffId" value={member.id} />
          <select name="role" defaultValue={member.role} className="admin-select" disabled={isSelf}>
            {ROLES.map((r) => <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>)}
          </select>
          {!isSelf && <SubmitButton>Save</SubmitButton>}
        </form>
        {!roleState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{roleState.message}</p>}
      </td>
      <td><PermissionSummary member={member} />
        <button type="button" onClick={() => setPermissionsOpen((v) => !v)} className="btn btn-ghost btn-sm mt-2">Manage Permissions</button>
        {permissionsOpen && (
          member.role === 'admissions_officer' ? (
            <AdmissionsPermissionsForm member={member} />
          ) : (
            <p className="text-xs mt-2 max-w-xs" style={{ color: 'var(--color-muted)' }}>
              {member.role === 'super_admin'
                ? 'Super Admins always have full access to every module and cannot be restricted.'
                : 'This role has fixed access to its module. Change the role above to Admissions Officer for adjustable, per-action permissions.'}
            </p>
          )
        )}
      </td>
      <td>
        <form action={activeAction}><input type="hidden" name="staffId" value={member.id} /><input type="hidden" name="nextActive" value={(!member.is_active).toString()} /><button type="submit" disabled={isSelf} className="btn btn-ghost btn-sm disabled:opacity-40">{member.is_active ? 'Deactivate' : 'Activate'}</button></form>
        {!activeState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{activeState.message}</p>}
      </td>
      <td>
        <button type="button" onClick={() => setResetOpen((v) => !v)} className="btn btn-ghost btn-sm">Reset Password</button>
        {resetOpen && (
          <form ref={resetFormRef} action={passwordAction} className="mt-2 grid gap-2">
            <input type="hidden" name="staffId" value={member.id} />
            <input name="password" type="password" minLength={8} maxLength={128} required placeholder="New password" autoComplete="new-password" className="field-input" />
            <input name="confirmPassword" type="password" minLength={8} maxLength={128} required placeholder="Confirm new password" autoComplete="new-password" className="field-input" />
            <SubmitButton>Set password</SubmitButton>
          </form>
        )}
        {passwordState.message && <p className="text-xs mt-1" style={{ color: passwordState.ok ? 'var(--color-success)' : 'var(--color-danger)' }}>{passwordState.message}</p>}
      </td>
    </tr>
  )
}
