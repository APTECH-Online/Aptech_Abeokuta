'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
export type ManageResult = { ok: boolean; message: string }
export async function cancelConsultationBooking(_prev: ManageResult, formData: FormData): Promise<ManageResult> {
  const token = String(formData.get('token') || '')
  if (!/^[a-f0-9]{48}$/.test(token)) return { ok:false, message:'This management link is invalid.' }
  try {
    const admin = createAdminClient()
    const { data: booking, error: lookupError } = await admin.from('consultation_bookings').select('id,status').eq('cancellation_token', token).maybeSingle()
    if (lookupError || !booking) return { ok:false, message:'Booking not found. Please contact admissions for help.' }
    if (booking.status !== 'confirmed') return { ok:false, message:`This booking is already ${booking.status.replace('_',' ')}.` }
    const { error } = await admin.from('consultation_bookings').update({ status:'cancelled', updated_at:new Date().toISOString() }).eq('id',booking.id)
    if (error) throw error
    revalidatePath('/admin/bookings')
    return { ok:true, message:'Your booking has been cancelled. You can book a new time whenever you are ready.' }
  } catch (error) { console.error('[consultation-booking] cancellation failed', error); return { ok:false, message:'We could not cancel this booking right now. Please try again or contact admissions.' } }
}
