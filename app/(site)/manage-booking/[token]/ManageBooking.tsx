'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cancelConsultationBooking, type ManageResult } from './actions'
const initial: ManageResult = { ok:false, message:'' }
export default function ManageBooking({ token, status }: { token:string; status:string }) {
 const [result, action, pending] = useActionState(cancelConsultationBooking, initial)
 return <div className="rounded-3xl border p-6 sm:p-9" style={{background:'var(--color-paper)',borderColor:'var(--color-line)'}}>
  {result.ok ? <CheckCircle2 size={36} style={{color:'#18764a'}}/> : <AlertTriangle size={36} style={{color:'#1d1250'}}/>}
  <h1 className="mt-4 text-2xl font-bold" style={{color:'var(--color-ink)'}}>{result.ok ? 'Booking cancelled' : 'Manage your appointment'}</h1>
  <p className="mt-3 text-sm leading-7" style={{color:'var(--color-muted)'}}>{result.message || (status === 'confirmed' ? 'If your plans have changed, you can cancel this appointment below. To reschedule, cancel this booking and choose another available time.' : `This booking is currently ${status.replace('_',' ')}.`)}</p>
  {!result.ok && status === 'confirmed' && <form action={action} className="mt-6"><input type="hidden" name="token" value={token}/><button type="submit" disabled={pending} className="btn btn-primary">{pending ? 'Cancelling…' : 'Cancel appointment'}</button></form>}
  <Link href="/book-consultation" className="btn btn-secondary mt-4 inline-flex">Book or reschedule</Link>
 </div>
}
