import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30']
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ slots: [], error: 'Invalid date' }, { status: 400 })
  const parsed = new Date(`${date}T12:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.getUTCDay() === 0 || parsed.getUTCDay() === 6) return NextResponse.json({ slots: [] })
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('consultation_bookings').select('appointment_time').eq('appointment_date', date).eq('status','confirmed')
    if (error) throw error
    const booked = new Set((data ?? []).map((row) => String(row.appointment_time).slice(0,5)))
    const isToday = date === new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Lagos', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())
    const current = new Intl.DateTimeFormat('en-GB', { timeZone:'Africa/Lagos', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date())
    const slots = SLOTS.filter((slot) => !booked.has(slot) && (!isToday || slot > current))
    return NextResponse.json({ slots }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[consultation-availability] failed', error)
    return NextResponse.json({ slots: [], error: 'Availability is temporarily unavailable' }, { status: 503 })
  }
}
