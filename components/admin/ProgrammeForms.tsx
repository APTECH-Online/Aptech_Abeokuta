'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import {
  createProgramme,
  updateProgramme,
  toggleProgrammeStatus,
  type ActionResult
} from '../../app/admin/(dashboard)/programmes/actions'
import type { Programme } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

function Fields({ programme, fieldErrors }: { programme?: Programme; fieldErrors?: Record<string, string> }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">Programme name</label>
          <input id="name" name="name" required defaultValue={programme?.name} className={`field-input ${fieldErrors?.name ? 'field-error' : ''}`} />
          {fieldErrors?.name && <p className="field-error-text">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="code">Programme code</label>
          <input id="code" name="code" required defaultValue={programme?.code} placeholder="e.g. ADSE" className={`field-input ${fieldErrors?.code ? 'field-error' : ''}`} />
          {fieldErrors?.code && <p className="field-error-text">{fieldErrors.code}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="duration">Duration</label>
          <input id="duration" name="duration" defaultValue={programme?.duration ?? ''} placeholder="e.g. 12 months" className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={programme?.status ?? 'active'} className="field-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={programme?.description ?? ''} className="field-textarea" />
      </div>
    </>
  )
}

export function CreateProgrammeForm() {
  const [state, formAction] = useActionState(createProgramme, initial)
  const [open, setOpen] = useState(false)

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary btn-sm">Add programme</button>
  }

  return (
    <form action={formAction} className="card p-5 sm:p-6 grid gap-4">
      <p className="eyebrow">New programme</p>
      <Fields fieldErrors={!state.ok ? state.fieldErrors : undefined} />
      {!state.ok && (
        <FormAlert variant="error" title="Couldn't save programme"><p>{state.message}</p></FormAlert>
      )}
      <div className="flex gap-2">
        <SubmitButton>Create programme</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
    </form>
  )
}

export function EditProgrammeForm({ programme }: { programme: Programme }) {
  const [state, formAction] = useActionState(updateProgramme, initial)
  const [open, setOpen] = useState(false)

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">Edit</button>
  }

  return (
    <form action={formAction} className="card p-5 sm:p-6 grid gap-4 mt-3">
      <input type="hidden" name="programmeId" value={programme.id} />
      <p className="eyebrow">Edit programme</p>
      <Fields programme={programme} fieldErrors={!state.ok ? state.fieldErrors : undefined} />
      {!state.ok && (
        <FormAlert variant="error" title="Couldn't save programme"><p>{state.message}</p></FormAlert>
      )}
      <div className="flex gap-2">
        <SubmitButton>Save changes</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
    </form>
  )
}

export function ToggleProgrammeStatusForm({ programme }: { programme: Programme }) {
  const [state, formAction] = useActionState(toggleProgrammeStatus, initial)
  const nextStatus = programme.status === 'active' ? 'inactive' : 'active'

  return (
    <form action={formAction}>
      <input type="hidden" name="programmeId" value={programme.id} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <button type="submit" className="btn btn-ghost btn-sm">
        {programme.status === 'active' ? 'Deactivate' : 'Activate'}
      </button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}
