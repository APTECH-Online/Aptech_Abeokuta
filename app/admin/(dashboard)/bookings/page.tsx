import Link from 'next/link'
import { CalendarDays, Clock3, CheckCircle2, CalendarCheck } from 'lucide-react'
import { guardAdminPage } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { hasAnyModulePermission, hasPermission } from '../../../../lib/permissions'
import BookingStatusForm from './BookingStatusForm'
import BookingAssignmentForm from './BookingAssignmentForm'

export const metadata = { title: 'Counselling Bookings | APTECH Admissions CRM' }
export const dynamic = 'force-dynamic'
const typeLabels: Record<string,string> = { campus: 'Campus visit', phone: 'Phone call', virtual: 'Virtual meeting' }
const statusLabels: Record<string,string> = { confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }
function dateLabel(date: string) { const d = new Date(`${date}T12:00:00+01:00`); return new Intl.DateTimeFormat('en-NG',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'}).format(d) }
export default async function ConsultationBookingsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const currentStaff = await guardAdminPage((staff) => staff.role === 'super_admin' || staff.role === 'admissions_officer' || hasAnyModulePermission(staff, 'enquiries'))
  const canUpdateStatus = currentStaff.role === 'super_admin' || currentStaff.role === 'admissions_officer' || hasPermission(currentStaff, 'enquiries.update_status')
  const canAssign = currentStaff.role === 'super_admin' || currentStaff.role === 'admissions_officer' || hasPermission(currentStaff, 'enquiries.assign')
  const params = await searchParams
  const filterStatus = ['confirmed','completed','cancelled','no_show'].includes(params.status || '') ? params.status! : ''
  const admin = createAdminClient()
  let query = admin.from('consultation_bookings').select('*, programme:programmes(name), assignee:staff!consultation_bookings_assigned_to_fkey(full_name)').order('appointment_date',{ascending:true}).order('appointment_time',{ascending:true}).limit(300)
  if (filterStatus) query = query.eq('status', filterStatus)
  const [{ data, error }, { data: allRows }, { data: staffRows }] = await Promise.all([
    query,
    admin.from('consultation_bookings').select('id,status,appointment_date').limit(5000),
    admin.from('staff').select('id,full_name').eq('is_active',true).order('full_name')
  ])
  const bookings = data ?? []
  const rows = allRows ?? []
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const staffOptions = staffRows ?? []
  const week = Array.from({length:7},(_,index)=>{ const d=new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+index); const key=d.toISOString().slice(0,10); return { key, label:new Intl.DateTimeFormat('en-NG',{weekday:'short',day:'numeric',month:'short',timeZone:'Africa/Lagos'}).format(d), count:rows.filter((r)=>r.appointment_date===key&&r.status==='confirmed').length } })
  const metrics = [
    { label: 'Total bookings', value: rows.length, icon: CalendarDays },
    { label: 'Confirmed', value: rows.filter((r) => r.status === 'confirmed').length, icon: CheckCircle2 },
    { label: 'Today', value: rows.filter((r) => r.appointment_date === today && r.status === 'confirmed').length, icon: Clock3 },
    { label: 'Completed', value: rows.filter((r) => r.status === 'completed').length, icon: CalendarCheck }
  ]
  return <div className="grid gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admissions & counselling</p><h1 className="h-section mt-1">Counselling bookings</h1><p className="mt-2 max-w-2xl text-sm" style={{color:'var(--color-muted)'}}>Review appointments, see the selected programme and update each booking as the conversation progresses.</p></div><Link href="/book-consultation" target="_blank" className="btn btn-primary">Open public booking page ↗</Link></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(({label,value,icon:Icon})=><div key={label} className="card p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm" style={{color:'var(--color-muted)'}}>{label}</p><Icon size={18} style={{color:'#1d1250'}}/></div><p className="mt-3 text-3xl font-bold" style={{color:'var(--color-ink)'}}>{value.toLocaleString()}</p></div>)}</div>
    <section className="card p-4 sm:p-5"><div className="flex items-center gap-2"><CalendarDays size={18} style={{color:'#1d1250'}}/><h2 className="font-semibold" style={{color:'var(--color-ink)'}}>Next 7 days</h2></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{week.map((day)=><div key={day.key} className="rounded-xl border p-3" style={{borderColor:'var(--color-line)',background:day.count?'rgba(29,18,80,.045)':'var(--color-paper)'}}><p className="text-xs" style={{color:'var(--color-muted)'}}>{day.label}</p><p className="mt-2 text-2xl font-bold" style={{color:'var(--color-ink)'}}>{day.count}</p><p className="text-[11px]" style={{color:'var(--color-muted)'}}>confirmed</p></div>)}</div></section>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5" style={{borderColor:'var(--color-line)'}}><div><h2 className="font-semibold" style={{color:'var(--color-ink)'}}>Appointment schedule</h2><p className="mt-1 text-xs" style={{color:'var(--color-muted)'}}>Showing up to 300 records · Africa/Lagos (WAT)</p></div><form className="flex flex-wrap gap-2"><select name="status" defaultValue={filterStatus} className="form-input text-sm"><option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No-show</option></select><button className="btn btn-secondary !px-4 !py-2" type="submit">Filter</button></form></div>
      {error ? <div className="p-6 text-sm" role="alert" style={{color:'#b42318'}}>Bookings could not be loaded. Confirm that migration 0033_consultation_booking.sql has been applied to your Supabase project.</div> : bookings.length === 0 ? <div className="p-10 text-center"><CalendarDays className="mx-auto" size={30} style={{color:'var(--color-muted)'}}/><h3 className="mt-3 font-semibold" style={{color:'var(--color-ink)'}}>No bookings to show</h3><p className="mt-1 text-sm" style={{color:'var(--color-muted)'}}>New consultation requests will appear here.</p></div> : <><div className="hidden overflow-x-auto md:block"><table className="admin-table"><thead><tr><th>Date & time</th><th>Prospect</th><th>Programme</th><th>Format</th><th>Reference</th><th>Counsellor</th><th>Status</th></tr></thead><tbody>{bookings.map((b:any)=><tr key={b.id}><td><strong>{dateLabel(b.appointment_date)}</strong><span className="mt-1 block text-xs" style={{color:'var(--color-muted)'}}>{String(b.appointment_time).slice(0,5)} WAT</span></td><td><strong>{b.full_name}</strong><span className="mt-1 block text-xs">{b.email}</span><span className="block text-xs">{b.phone}</span></td><td>{b.programme?.name || 'Programme guidance'}</td><td>{typeLabels[b.appointment_type] || b.appointment_type}</td><td><span className="font-mono text-xs">{b.booking_reference}</span></td><td>{canAssign ? <BookingAssignmentForm bookingId={b.id} assignedTo={b.assigned_to} staff={staffOptions}/> : (b.assignee?.full_name || '—')}</td><td>{canUpdateStatus ? <BookingStatusForm bookingId={b.id} status={b.status}/> : statusLabels[b.status] || b.status}</td></tr>)}</tbody></table></div><div className="grid gap-3 p-3 md:hidden">{bookings.map((b:any)=><article key={b.id} className="rounded-2xl border p-4" style={{borderColor:'var(--color-line)'}}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold" style={{color:'var(--color-ink)'}}>{b.full_name}</p><p className="mt-1 text-xs" style={{color:'var(--color-muted)'}}>{b.booking_reference}</p></div><span className="rounded-full px-2 py-1 text-[11px]" style={{background:b.status==='confirmed'?'rgba(24,118,74,.1)':'var(--color-paper-alt)',color:'var(--color-ink)'}}>{statusLabels[b.status] || b.status}</span></div><p className="mt-3 text-sm">{dateLabel(b.appointment_date)} · {String(b.appointment_time).slice(0,5)} WAT</p><p className="mt-1 text-sm" style={{color:'var(--color-muted)'}}>{b.email} · {b.phone}</p><p className="mt-1 text-sm" style={{color:'var(--color-muted)'}}>{b.programme?.name || 'Programme guidance'} · {typeLabels[b.appointment_type]}</p><div className="mt-4 grid gap-3">{canAssign && <BookingAssignmentForm bookingId={b.id} assignedTo={b.assigned_to} staff={staffOptions} />}{canUpdateStatus && <BookingStatusForm bookingId={b.id} status={b.status}/>}</div></article>)}</div></>}
    </section>
    <p className="text-xs" style={{color:'var(--color-muted)'}}>Only staff with admissions access can manage bookings. If the page is empty after deployment, apply the new Supabase migration before accepting live appointments.</p>
  </div>
}
