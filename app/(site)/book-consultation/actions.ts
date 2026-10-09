'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../lib/supabase/admin'
import { checkRateLimit } from '../../../lib/rate-limit'
import { sendEmail } from '../../../lib/email/send'
import { generateLeadReference } from '../../../lib/reference'
import { getSiteUrl } from '../../../lib/seo'

export type BookingResult = { ok: boolean; message: string; reference?: string; manageUrl?: string }
const allowedTypes = ['campus', 'phone', 'virtual'] as const
const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30']

export async function createConsultationBooking(_prev: BookingResult, formData: FormData): Promise<BookingResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`consultation-booking:${ip}`).allowed) return { ok: false, message: 'Too many booking attempts. Please wait a minute and try again.' }
  const fullName = String(formData.get('fullName') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const phone = String(formData.get('phone') || '').trim()
  const programmeId = String(formData.get('programmeId') || '')
  const appointmentType = String(formData.get('appointmentType') || '')
  const appointmentDate = String(formData.get('appointmentDate') || '')
  const appointmentTime = String(formData.get('appointmentTime') || '')
  const notes = String(formData.get('notes') || '').trim().slice(0, 1000)
  if (String(formData.get('companyWebsite') || '')) return { ok: true, message: 'Your request has been received.' }
  if (fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || phone.length > 30) return { ok: false, message: 'Please provide a valid name, email address and phone number.' }
  if (!(allowedTypes as readonly string[]).includes(appointmentType) || !slots.includes(appointmentTime) || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) return { ok: false, message: 'Please select a valid appointment type, date and time.' }
  const day = new Date(`${appointmentDate}T12:00:00Z`)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Lagos', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== appointmentDate || appointmentDate <= today || day.getUTCDay() === 0 || day.getUTCDay() === 6) return { ok: false, message: 'Please choose a future weekday.' }
  try {
    const admin = createAdminClient()
    if (programmeId) {
      const { data: programme } = await admin.from('programmes').select('id').eq('id', programmeId).eq('status','active').maybeSingle()
      if (!programme) return { ok: false, message: 'Please choose an available programme.' }
    }
    const { data: occupied, error: slotError } = await admin.from('consultation_bookings').select('id').eq('appointment_date', appointmentDate).eq('appointment_time', appointmentTime).eq('status','confirmed').maybeSingle()
    if (slotError) throw slotError
    if (occupied) return { ok: false, message: 'That time has just been booked. Please choose another available slot.' }
    const reference = `APC-${appointmentDate.replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
    const { data: lead } = await admin.from('leads').select('id').ilike('email', email).limit(1).maybeSingle()
    const { data: created, error } = await admin.from('consultation_bookings').insert({
      booking_reference: reference, full_name: fullName, email, phone,
      programme_id: programmeId || null, appointment_type: appointmentType,
      appointment_date: appointmentDate, appointment_time: appointmentTime,
      timezone: 'Africa/Lagos', notes: notes || null, lead_id: lead?.id ?? null
    }).select('id,cancellation_token').single()
    if (error) {
      if (error.code === '23505') return { ok: false, message: 'That slot is no longer available. Please choose another time.' }
      throw error
    }
    let linkedLeadId = lead?.id ?? null
    if (!linkedLeadId) {
      const nameParts = fullName.split(/\s+/)
      const firstName = nameParts[0] || fullName
      const lastName = nameParts.slice(1).join(' ') || '—'
      const { data: newLead, error: leadError } = await admin.from('leads').insert({ lead_reference: await generateLeadReference(admin), first_name: firstName, last_name: lastName, email, phone, status: 'new', source: 'advisor_request', landing_page: '/book-consultation' }).select('id').single()
      if (leadError) console.error('[consultation-booking] lead sync failed', leadError)
      else if (newLead?.id) { linkedLeadId = newLead.id; await admin.from('consultation_bookings').update({ lead_id: newLead.id }).eq('id', created.id) }
    }
    const manageUrl = `${getSiteUrl()}/manage-booking/${created.cancellation_token}`
    const displayDate = new Intl.DateTimeFormat('en-NG', { dateStyle: 'full', timeZone: 'Africa/Lagos' }).format(new Date(`${appointmentDate}T${appointmentTime}:00+01:00`))
    const typeLabel = appointmentType === 'campus' ? 'In-person at APTECH Abeokuta' : appointmentType === 'phone' ? 'Phone call' : 'Virtual meeting'
    const emailTasks = [sendEmail({ to: email, subject: `Your APTECH Abeokuta counselling is booked (${reference})`, text: `Hello ${fullName},\n\nYour admissions counselling appointment is booked.\nReference: ${reference}\nDate: ${displayDate}\nTime: ${appointmentTime} (WAT, Africa/Lagos)\nFormat: ${typeLabel}\n\nTo cancel or change your booking, visit ${manageUrl}. To reschedule, cancel this booking first and select a new available time.`, html: `<p>Hello ${escapeHtml(fullName)},</p><p>Your admissions counselling appointment is booked.</p><p><strong>Reference:</strong> ${reference}<br><strong>Date:</strong> ${displayDate}<br><strong>Time:</strong> ${appointmentTime} WAT (Africa/Lagos)<br><strong>Format:</strong> ${typeLabel}</p><p><a href="${manageUrl}">Manage or cancel this booking</a>. To reschedule, cancel this booking first and select a new available time.</p>` })]
    if (process.env.ADMISSIONS_NOTIFICATION_EMAIL) emailTasks.push(sendEmail({ to: process.env.ADMISSIONS_NOTIFICATION_EMAIL, subject: `New counselling booking: ${reference}`, text: `${fullName} (${email}, ${phone}) booked ${appointmentDate} at ${appointmentTime} WAT. Format: ${typeLabel}. Programme ID: ${programmeId || 'Not specified'}.`, html: `<p><strong>${escapeHtml(fullName)}</strong> booked admissions counselling.</p><p>${escapeHtml(email)} · ${escapeHtml(phone)}<br>${appointmentDate} at ${appointmentTime} WAT<br>${typeLabel}<br>Reference: ${reference}</p>` }))
    await Promise.allSettled(emailTasks)
    revalidatePath('/admin/bookings')
    return { ok: true, message: 'Your counselling session is booked. Keep your reference for any changes.', reference, manageUrl }
  } catch (error) {
    console.error('[consultation-booking] failed to create booking', error)
    return { ok: false, message: 'We could not complete your booking right now. Please try again shortly or contact admissions.' }
  }
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] || c)) }
