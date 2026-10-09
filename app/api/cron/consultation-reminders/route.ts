import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { sendEmail } from '../../../../lib/email/send'
import { getSiteUrl } from '../../../../lib/seo'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  try {
    const admin = createAdminClient()
    const now = Date.now()
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
    const tomorrowDate = new Date(`${today}T12:00:00+01:00`); tomorrowDate.setDate(tomorrowDate.getDate()+1)
    const tomorrow = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(tomorrowDate)
    const { data, error } = await admin.from('consultation_bookings').select('id,booking_reference,full_name,email,appointment_date,appointment_time,appointment_type,cancellation_token').eq('status','confirmed').is('reminder_sent_at',null).in('appointment_date',[today,tomorrow]).limit(500)
    if (error) throw error
    let sent = 0
    for (const booking of data ?? []) {
      const appointmentAt = new Date(`${booking.appointment_date}T${String(booking.appointment_time).slice(0,5)}:00+01:00`).getTime()
      const hoursAway = (appointmentAt - now) / 3600000
      if (hoursAway < 23.5 || hoursAway > 24.5) continue
      const manageUrl = `${getSiteUrl()}/manage-booking/${booking.cancellation_token}`
      const date = new Intl.DateTimeFormat('en-NG',{dateStyle:'full',timeZone:'Africa/Lagos'}).format(new Date(appointmentAt))
      const result = await sendEmail({ to:booking.email, subject:`Reminder: APTECH counselling tomorrow (${booking.booking_reference})`, text:`Hello ${booking.full_name}, this is a reminder of your APTECH Abeokuta admissions counselling appointment tomorrow, ${date} at ${String(booking.appointment_time).slice(0,5)} WAT. Manage or cancel: ${manageUrl}`, html:`<p>Hello ${escapeHtml(booking.full_name)},</p><p>This is a friendly reminder of your APTECH Abeokuta admissions counselling appointment.</p><p><strong>${date}</strong><br>${String(booking.appointment_time).slice(0,5)} WAT<br>Reference: ${booking.booking_reference}</p><p><a href="${manageUrl}">Manage or cancel your booking</a></p>` })
      if (result.ok) { await admin.from('consultation_bookings').update({ reminder_sent_at:new Date().toISOString() }).eq('id',booking.id); sent++ }
    }
    return NextResponse.json({ ok:true, checked:data?.length ?? 0, remindersSent:sent })
  } catch (error) { console.error('[consultation-reminders] failed',error); return NextResponse.json({error:'Reminder processing failed'},{status:500}) }
}
function escapeHtml(value:string) { return value.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c)) }
