'use client'
import { useActionState } from 'react'
import { updateBookingStatus, type BookingActionResult } from './actions'
const initial: BookingActionResult = { ok: false }
export default function BookingStatusForm({ bookingId, status }: { bookingId: string; status: string }) {
  const [result, action, pending] = useActionState(updateBookingStatus, initial)
  return <form action={action} className="flex min-w-[190px] flex-col gap-2 sm:flex-row sm:items-center">
    <input type="hidden" name="bookingId" value={bookingId}/>
    <select name="status" defaultValue={status} className="form-input text-xs" aria-label="Booking status"><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No-show</option></select>
    <button className="btn btn-secondary !px-3 !py-2 !text-xs" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Update'}</button>
    {result.message && <span className="text-xs" role="status" style={{ color: result.ok ? '#18764a' : '#b42318' }}>{result.message}</span>}
  </form>
}
