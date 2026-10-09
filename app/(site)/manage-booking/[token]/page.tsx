import Container from '../../../../components/ui/Container'
import { createAdminClient } from '../../../../lib/supabase/admin'
import ManageBooking from './ManageBooking'
export const metadata = { title: 'Manage Counselling Booking | APTECH Abeokuta', robots: { index:false, follow:false } }
export const dynamic = 'force-dynamic'
export default async function ManageBookingPage({ params }: { params: Promise<{ token:string }> }) {
 const { token } = await params
 let booking: {status:string; booking_reference:string; appointment_date:string; appointment_time:string} | null = null
 if (/^[a-f0-9]{48}$/.test(token)) {
  try { const admin = createAdminClient(); const {data} = await admin.from('consultation_bookings').select('status,booking_reference,appointment_date,appointment_time').eq('cancellation_token',token).maybeSingle(); booking = data } catch (error) { console.error('[manage-booking] lookup failed',error) }
 }
 return <section className="section" style={{background:'var(--color-paper-alt)'}}><Container className="max-w-2xl"><p className="eyebrow">Admissions booking</p>{booking ? <><p className="mt-3 mb-5 text-sm" style={{color:'var(--color-muted)'}}>Reference <strong style={{color:'var(--color-ink)'}}>{booking.booking_reference}</strong> · {new Intl.DateTimeFormat('en-NG',{dateStyle:'full',timeZone:'Africa/Lagos'}).format(new Date(`${booking.appointment_date}T12:00:00+01:00`))} at {String(booking.appointment_time).slice(0,5)} WAT</p><ManageBooking token={token} status={booking.status}/></> : <div className="rounded-3xl border p-8" style={{background:'var(--color-paper)',borderColor:'var(--color-line)'}}><h1 className="text-2xl font-bold" style={{color:'var(--color-ink)'}}>Link unavailable</h1><p className="mt-3 text-sm" style={{color:'var(--color-muted)'}}>This management link is invalid or has expired. Contact admissions if you need help with your booking.</p></div>}</Container></section>
}
