'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireCrmAction, ForbiddenError, UnauthorizedError } from '../../../../lib/auth'
import { logAudit } from '../../../../lib/audit'

export type BookingActionResult = { ok: boolean; message?: string }
export async function updateBookingStatus(_prev: BookingActionResult, formData: FormData): Promise<BookingActionResult> {
  try {
    const staff = await requireCrmAction('enquiries', 'update_status')
    const id = String(formData.get('bookingId') || '')
    const status = String(formData.get('status') || '')
    if (!id || !['confirmed','completed','cancelled','no_show'].includes(status)) return { ok: false, message: 'Select a valid booking and status.' }
    const admin = createAdminClient()
    const { data: existing, error: lookupError } = await admin.from('consultation_bookings').select('id,status,booking_reference').eq('id', id).maybeSingle()
    if (lookupError || !existing) return { ok: false, message: 'Booking not found.' }
    const { error } = await admin.from('consultation_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      if (error.code === '23505') return { ok: false, message: 'That time slot is already occupied by another confirmed booking.' }
      console.error('[bookings] status update failed', error)
      return { ok: false, message: 'Could not update this booking.' }
    }
    await logAudit(admin, { userId: staff.id, action: 'consultation_booking.status_changed', entity: 'consultation_booking', entityId: id, metadata: { from: existing.status, to: status, reference: existing.booking_reference } })
    revalidatePath('/admin/bookings')
    revalidatePath('/admin')
    return { ok: true, message: `Booking updated to ${status.replace('_',' ')}.` }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, message: 'Please sign in again.' }
    if (error instanceof ForbiddenError) return { ok: false, message: "You don't have permission to manage bookings." }
    console.error('[bookings] update error', error)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}

export async function assignBooking(_prev: BookingActionResult, formData: FormData): Promise<BookingActionResult> {
  try {
    const staff = await requireCrmAction('enquiries', 'assign')
    const id = String(formData.get('bookingId') || '')
    const assignedTo = String(formData.get('assignedTo') || '')
    if (!id) return { ok:false, message:'Missing booking.' }
    const admin = createAdminClient()
    if (assignedTo) {
      const { data: assignee } = await admin.from('staff').select('id').eq('id',assignedTo).eq('is_active',true).maybeSingle()
      if (!assignee) return { ok:false, message:'Choose an active staff member.' }
    }
    const { error } = await admin.from('consultation_bookings').update({ assigned_to:assignedTo || null, updated_at:new Date().toISOString() }).eq('id',id)
    if (error) return { ok:false, message:'Could not assign this booking.' }
    await logAudit(admin,{ userId:staff.id, action:'consultation_booking.assigned', entity:'consultation_booking', entityId:id, metadata:{assignedTo:assignedTo || null} })
    revalidatePath('/admin/bookings')
    return {ok:true,message:'Assignment saved.'}
  } catch (error) {
    if (error instanceof UnauthorizedError) return {ok:false,message:'Please sign in again.'}
    if (error instanceof ForbiddenError) return {ok:false,message:"You don't have permission to assign bookings."}
    console.error('[bookings] assignment failed',error)
    return {ok:false,message:'Something went wrong. Please try again.'}
  }
}
