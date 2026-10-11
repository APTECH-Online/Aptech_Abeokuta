'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { useActionFeedback } from './AdminFeedbackProvider'
import { saveEvent, type EventActionResult } from '../../app/admin/(dashboard)/events/actions'
import { DELIVERY_MODE_LABELS, DELIVERY_MODE_VALUES, EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, isoToWatLocal } from '../../lib/event-admin'

const initial: EventActionResult = { ok: true }

export interface EventFormValues {
  id: string
  title: string
  slug: string
  event_type: string
  description: string
  starts_at: string
  ends_at: string | null
  location: string
  delivery_mode: string
  meeting_url: string | null
  capacity: number | null
  registration_open: boolean
}

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

export default function EventForm({ mode, event }: { mode: 'create' | 'edit'; event?: EventFormValues }) {
  const router = useRouter()
  const [state, formAction] = useActionState(saveEvent, initial)
  useActionFeedback(state, mode === 'create' ? 'Event created.' : 'Event saved.')
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  useEffect(() => {
    if (mode === 'create' && state.ok && state.id) router.push('/admin/events')
  }, [mode, state, router])

  const err = (key: string) => (fieldErrors?.[key] ? <p className="field-error">{fieldErrors[key]}</p> : null)

  return (
    <form action={formAction} className="grid gap-6 max-w-2xl">
      {mode === 'edit' && event && <input type="hidden" name="eventId" value={event.id} />}
      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input id="title" name="title" required maxLength={160} defaultValue={event?.title ?? ''} className="admin-input" placeholder="e.g. Introduction to Web Development" />
        {err('title')}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="event_type" className="field-label">Event type</label>
          <select id="event_type" name="event_type" required defaultValue={event?.event_type ?? 'coding_workshop'} className="admin-input">
            {EVENT_TYPE_VALUES.map((v) => <option key={v} value={v}>{EVENT_TYPE_LABELS[v]}</option>)}
          </select>
          {err('event_type')}
        </div>
        <div>
          <label htmlFor="delivery_mode" className="field-label">Delivery</label>
          <select id="delivery_mode" name="delivery_mode" required defaultValue={event?.delivery_mode ?? 'in_person'} className="admin-input">
            {DELIVERY_MODE_VALUES.map((v) => <option key={v} value={v}>{DELIVERY_MODE_LABELS[v]}</option>)}
          </select>
          {err('delivery_mode')}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="field-label">Starts (WAT)</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={isoToWatLocal(event?.starts_at)} className="admin-input" />
          {err('starts_at')}
        </div>
        <div>
          <label htmlFor="ends_at" className="field-label">Ends (WAT, optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={isoToWatLocal(event?.ends_at)} className="admin-input" />
          {err('ends_at')}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="field-label">Venue</label>
        <input id="location" name="location" maxLength={200} defaultValue={event?.location ?? ''} className="admin-input" placeholder="APTECH Abeokuta (leave blank for the default)" />
        {err('location')}
      </div>

      <div>
        <label htmlFor="meeting_url" className="field-label">Meeting link (online / hybrid)</label>
        <input id="meeting_url" name="meeting_url" type="url" maxLength={500} defaultValue={event?.meeting_url ?? ''} className="admin-input" placeholder="https://meet.google.com/…" />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Only emailed to people who register. It is never shown on the public page.</p>
        {err('meeting_url')}
      </div>

      <div>
        <label htmlFor="description" className="field-label">Description</label>
        <textarea id="description" name="description" rows={5} maxLength={2000} defaultValue={event?.description ?? ''} className="admin-input" placeholder="What attendees will do and learn" />
        {err('description')}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="capacity" className="field-label">Places (optional)</label>
          <input id="capacity" name="capacity" type="number" min={1} step={1} defaultValue={event?.capacity ?? ''} className="admin-input" placeholder="Leave blank for no limit" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Registration closes automatically when the event is full.</p>
          {err('capacity')}
        </div>
        <div>
          <label htmlFor="slug" className="field-label">Web address (optional)</label>
          <input id="slug" name="slug" maxLength={90} defaultValue={event?.slug ?? ''} className="admin-input" placeholder="auto-generated from the title" />
          {err('slug')}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
        <input type="checkbox" name="registration_open" defaultChecked={event?.registration_open ?? true} />
        Registration open (event is listed on the public page)
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton>{mode === 'create' ? 'Create event' : 'Save changes'}</SubmitButton>
      </div>
    </form>
  )
}
