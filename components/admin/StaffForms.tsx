'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { inviteStaffMember, updateStaffRole, toggleStaffActive, type ActionResult } from '../../app/admin/(dashboard)/settings/actions'
import { STAFF_ROLE_LABELS, type Staff, type StaffRole } from '../../types/db'

const initial: ActionResult = { ok: true }
const ROLES: StaffRole[] = ['super_admin', 'admissions_manager', 'admissions_officer', 'counsellor', 'viewer']

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm disabled:opacity-60">
      {pending ? 'Working…' : children}
    </button>
  )
}

export function InviteStaffForm() {
  const [state, formAction] = useActionState(inviteStaffMember, initial)
  const [open, setOpen] = useState(false)

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary btn-sm">Invite staff member</button>
  }

  return (
    <form action={formAction} className="card p-5 sm:p-6 grid gap-4">
      <p className="eyebrow">Invite staff member</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className="field-label">Full name</label>
          <input id="fullName" name="fullName" required className="field-input" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">Work email</label>
          <input id="email" name="email" type="email" required className="field-input" />
        </div>
      </div>
      <div>
        <label htmlFor="role" className="field-label">Role</label>
        <select id="role" name="role" defaultValue="admissions_officer" className="field-select">
          {ROLES.map((r) => (
            <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      {!state.ok ? (
        <FormAlert variant="error" title="Couldn't send invite"><p>{state.message}</p></FormAlert>
      ) : state.message ? (
        <FormAlert variant="success" title="Invite sent"><p>{state.message}</p></FormAlert>
      ) : null}
      <div className="flex gap-2">
        <SubmitButton>Send invite</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Close</button>
      </div>
    </form>
  )
}

export function StaffRow({ member, isSelf }: { member: Staff; isSelf: boolean }) {
  const [roleState, roleAction] = useActionState(updateStaffRole, initial)
  const [activeState, activeAction] = useActionState(toggleStaffActive, initial)

  return (
    <tr>
      <td className="font-medium" style={{ color: 'var(--color-ink)' }}>{member.full_name}{isSelf && ' (you)'}</td>
      <td>{member.email}</td>
      <td>
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="staffId" value={member.id} />
          <select name="role" defaultValue={member.role} className="admin-select" disabled={isSelf}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
            ))}
          </select>
          {!isSelf && <SubmitButton>Save</SubmitButton>}
        </form>
        {!roleState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{roleState.message}</p>}
      </td>
      <td>
        <form action={activeAction}>
          <input type="hidden" name="staffId" value={member.id} />
          <input type="hidden" name="nextActive" value={(!member.is_active).toString()} />
          <button type="submit" disabled={isSelf} className="btn btn-ghost btn-sm disabled:opacity-40">
            {member.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </form>
        {!activeState.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{activeState.message}</p>}
      </td>
    </tr>
  )
}
