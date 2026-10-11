'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { requireEventsAccess } from '../../../../lib/events-access'
import { logAudit } from '../../../../lib/audit'
import { parseEventForm } from '../../../../lib/event-admin'

export type EventActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

const ATTENDANCE = ['registered', 'attended', 'no_show', 'cancelled']
const OUTCOMES = ['not_recorded', 'interested', 'requested_counselling', 'application_started', 'not_interested', 'no_follow_up_needed']

function failure(err: unknown): EventActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
  if (err instanceof ForbiddenError) return { ok: false, message: err.message }
  console.error('[crm] unexpected events error', err)
  return { ok: false, message: 'Something went wrong. Please try again.' }
}

function revalidateEventPaths() {
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/sitemap.xml')
}

/** Used as a plain <form action>: throws on failure so the error boundary reports it. */
export async function updateEventRegistration(formData: FormData) {
  const staff = await requireEventsAccess('edit')
  const id = String(formData.get('id') || '')
  const attendance_status = String(formData.get('attendance_status') || 'registered')
  const inquiry_outcome = String(formData.get('inquiry_outcome') || 'not_recorded')
  if (!id || !ATTENDANCE.includes(attendance_status) || !OUTCOMES.includes(inquiry_outcome)) throw new Error('Invalid event outcome')

  const db = createAdminClient()
  const { error } = await db
    .from('event_registrations')
    .update({ attendance_status, inquiry_outcome, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error('Could not update event outcome')

  await logAudit(db, { userId: staff.id, action: 'event_registration.updated', entity: 'event_registration', entityId: id, metadata: { attendance_status, inquiry_outcome } })
  revalidatePath('/admin/events')
}

/** Create (no eventId) or update (eventId present) an event. */
export async function saveEvent(_prev: EventActionResult, formData: FormData): Promise<EventActionResult> {
  try {
    const eventId = String(formData.get('eventId') || '')
    const isEdit = Boolean(eventId)
    const staff = await requireEventsAccess(isEdit ? 'edit' : 'create')

    const parsed = parseEventForm(Object.fromEntries(formData.entries()), { requireFuture: !isEdit })
    if (!parsed.ok) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: parsed.fieldErrors }
    const data = parsed.data
    const db = createAdminClient()

    if (isEdit && data.capacity !== null) {
      const { count } = await db
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .neq('attendance_status', 'cancelled')
      if ((count ?? 0) > data.capacity) {
        return {
          ok: false,
          message: 'Please fix the highlighted fields.',
          fieldErrors: { capacity: `This event already has ${count} registrations. Capacity cannot be lower than that.` }
        }
      }
    }

    // Slug must be unique. A typed-in slug that clashes is an error; an auto-generated one gets a suffix.
    const typedSlug = String(formData.get('slug') || '').trim() !== ''
    let slug = data.slug
    const slugTaken = async (candidate: string) => {
      let q = db.from('campus_events').select('id').eq('slug', candidate)
      if (isEdit) q = q.neq('id', eventId)
      const { data: row } = await q.maybeSingle()
      return Boolean(row)
    }
    if (await slugTaken(slug)) {
      if (typedSlug) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: { slug: 'Another event already uses this web address. Choose a different one.' } }
      slug = `${slug}-${data.starts_at.slice(0, 10).replace(/-/g, '')}`
      if (await slugTaken(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const row = { ...data, slug, updated_at: new Date().toISOString() }
    if (isEdit) {
      const { error } = await db.from('campus_events').update(row).eq('id', eventId)
      if (error) {
        console.error('[crm] failed to update event', error)
        return { ok: false, message: 'Could not save this event.' }
      }
      await logAudit(db, { userId: staff.id, action: 'event.updated', entity: 'event', entityId: eventId, metadata: { title: data.title } })
      revalidateEventPaths()
      return { ok: true, id: eventId, message: 'Event saved.' }
    }

    const { data: created, error } = await db.from('campus_events').insert(row).select('id').single()
    if (error || !created) {
      console.error('[crm] failed to create event', error)
      return { ok: false, message: 'Could not create this event.' }
    }
    await logAudit(db, { userId: staff.id, action: 'event.created', entity: 'event', entityId: created.id, metadata: { title: data.title } })
    revalidateEventPaths()
    return { ok: true, id: created.id, message: 'Event created.' }
  } catch (err) {
    return failure(err)
  }
}

/** Open/close registration from the events table. Plain <form action>. */
export async function setRegistrationOpen(formData: FormData) {
  const staff = await requireEventsAccess('edit')
  const id = String(formData.get('id') || '')
  const open = String(formData.get('open') || '') === 'true'
  if (!id) throw new Error('Missing event')
  const db = createAdminClient()
  const { error } = await db.from('campus_events').update({ registration_open: open, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('Could not update the event')
  await logAudit(db, { userId: staff.id, action: open ? 'event.registration_opened' : 'event.registration_closed', entity: 'event', entityId: id })
  revalidateEventPaths()
}

/** Super Admin only, and only while nobody has registered (otherwise close registration instead). */
export async function deleteEvent(formData: FormData) {
  const staff = await requireEventsAccess('delete')
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing event')
  const db = createAdminClient()
  const { count } = await db.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', id)
  if ((count ?? 0) > 0) throw new Error('This event has registrations. Close registration instead of deleting it.')
  const { error } = await db.from('campus_events').delete().eq('id', id)
  if (error) throw new Error('Could not delete the event')
  await logAudit(db, { userId: staff.id, action: 'event.deleted', entity: 'event', entityId: id })
  revalidateEventPaths()
  redirect('/admin/events')
}
