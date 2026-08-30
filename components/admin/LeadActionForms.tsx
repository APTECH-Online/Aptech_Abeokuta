'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import {
  addInteraction,
  changeLeadStatus,
  assignLead,
  scheduleFollowUp,
  editLeadInfo,
  startApplication,
  type ActionResult
} from '../../app/admin/(dashboard)/leads/[id]/actions'
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS, INTERACTION_TYPE_LABELS, type LeadStatus } from '../../types/db'

const initial: ActionResult = { ok: true }

function TinyButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

function Feedback({ state }: { state: ActionResult }) {
  if (state.ok) return null
  return (
    <FormAlert variant="error" title="Couldn't save">
      <p>{state.message}</p>
    </FormAlert>
  )
}

export function StatusChangeForm({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const [state, formAction] = useActionState(changeLeadStatus, initial)
  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor="status" className="field-label">Pipeline status</label>
      <div className="flex flex-wrap gap-2">
        <select id="status" name="status" defaultValue={currentStatus} className="admin-select flex-1 min-w-[180px]">
          {LEAD_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <TinyButton>Update</TinyButton>
      </div>
      <Feedback state={state} />
    </form>
  )
}

export function AssignForm({
  leadId,
  currentAssignedTo,
  staffOptions
}: {
  leadId: string
  currentAssignedTo: string | null
  staffOptions: { id: string; full_name: string }[]
}) {
  const [state, formAction] = useActionState(assignLead, initial)
  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor="assignedTo" className="field-label">Assigned to</label>
      <div className="flex flex-wrap gap-2">
        <select id="assignedTo" name="assignedTo" defaultValue={currentAssignedTo ?? ''} className="admin-select flex-1 min-w-[180px]">
          <option value="">Unassigned</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
        <TinyButton>Assign</TinyButton>
      </div>
      <Feedback state={state} />
    </form>
  )
}

export function InteractionForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(addInteraction, initial)
  const [type, setType] = useState('note')

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="type" className="field-label">Type</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} className="admin-select w-full">
            {Object.entries(INTERACTION_TYPE_LABELS)
              .filter(([value]) => value !== 'website')
              .map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="subject" className="field-label">Subject (optional)</label>
          <input id="subject" name="subject" className="admin-input w-full" placeholder="e.g. Fee enquiry" />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="field-label">Details</label>
        <textarea id="description" name="description" required rows={3} className="field-textarea" placeholder="What happened?" />
      </div>
      <div className="flex justify-end">
        <TinyButton>Add to timeline</TinyButton>
      </div>
      <Feedback state={state} />
    </form>
  )
}

export function FollowUpForm({
  leadId,
  staffOptions,
  currentStaffId
}: {
  leadId: string
  staffOptions: { id: string; full_name: string }[]
  currentStaffId: string
}) {
  const [state, formAction] = useActionState(scheduleFollowUp, initial)

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dueDate" className="field-label">Due date</label>
          <input id="dueDate" name="dueDate" type="datetime-local" required className="admin-input w-full" />
        </div>
        <div>
          <label htmlFor="fuType" className="field-label">Type</label>
          <select id="fuType" name="type" defaultValue="call" className="admin-select w-full">
            {Object.entries(INTERACTION_TYPE_LABELS)
              .filter(([value]) => value !== 'website' && value !== 'note')
              .map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="assignedTo" className="field-label">Assign to</label>
        <select id="assignedTo" name="assignedTo" defaultValue={currentStaffId} className="admin-select w-full">
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="fuNotes" className="field-label">Notes (optional)</label>
        <textarea id="fuNotes" name="notes" rows={2} className="field-textarea" placeholder="What should the reminder cover?" />
      </div>
      <div className="flex justify-end">
        <TinyButton>Schedule follow-up</TinyButton>
      </div>
      <Feedback state={state} />
    </form>
  )
}

export function EditLeadForm({ lead }: { lead: any }) {
  const [state, formAction] = useActionState(editLeadInfo, initial)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
        Edit contact information
      </button>
    )
  }

  return (
    <form action={formAction} className="card p-5 grid gap-4 mt-3">
      <input type="hidden" name="leadId" value={lead.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="field-label">First name</label>
          <input id="firstName" name="firstName" defaultValue={lead.first_name} required className="field-input" />
        </div>
        <div>
          <label htmlFor="lastName" className="field-label">Last name</label>
          <input id="lastName" name="lastName" defaultValue={lead.last_name} required className="field-input" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" defaultValue={lead.email} required className="field-input" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone</label>
          <input id="phone" name="phone" defaultValue={lead.phone} required className="field-input" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="whatsapp" className="field-label">WhatsApp</label>
          <input id="whatsapp" name="whatsapp" defaultValue={lead.whatsapp ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="gender" className="field-label">Gender</label>
          <input id="gender" name="gender" defaultValue={lead.gender ?? ''} className="field-input" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="field-label">City</label>
          <input id="city" name="city" defaultValue={lead.city ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="state" className="field-label">State</label>
          <input id="state" name="state" defaultValue={lead.state ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="country" className="field-label">Country</label>
          <input id="country" name="country" defaultValue={lead.country ?? ''} className="field-input" />
        </div>
      </div>
      <div>
        <label htmlFor="address" className="field-label">Address</label>
        <input id="address" name="address" defaultValue={lead.address ?? ''} className="field-input" />
      </div>
      <Feedback state={state} />
      <div className="flex gap-2">
        <TinyButton>Save changes</TinyButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
    </form>
  )
}

export function StartApplicationForm({
  leadId,
  programmes,
  defaultProgrammeId
}: {
  leadId: string
  programmes: { id: string; name: string }[]
  defaultProgrammeId?: string
}) {
  const [state, formAction] = useActionState(startApplication, initial)

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor="programmeId" className="field-label">Programme</label>
      <div className="flex flex-wrap gap-2">
        <select id="programmeId" name="programmeId" defaultValue={defaultProgrammeId ?? ''} required className="admin-select flex-1 min-w-[200px]">
          <option value="" disabled>Select programme</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <TinyButton>Start application</TinyButton>
      </div>
      <Feedback state={state} />
    </form>
  )
}
