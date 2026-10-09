'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, Clock3, MapPin, Phone, Video, ArrowRight, ShieldCheck } from 'lucide-react'
import { createConsultationBooking, type BookingResult } from './actions'

type Programme = { id: string; name: string; duration?: string | null }
const initialState: BookingResult = { ok: false, message: '' }
const types = [
  { value: 'campus', label: 'Visit our campus', detail: 'Meet the admissions team in person', icon: MapPin },
  { value: 'phone', label: 'Phone call', detail: 'A convenient call at your chosen time', icon: Phone },
  { value: 'virtual', label: 'Virtual meeting', detail: 'Speak with an advisor online', icon: Video }
]

export default function BookingForm({ programmes }: { programmes: Programme[] }) {
  const [state, action, pending] = useActionState(createConsultationBooking, initialState)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [step, setStep] = useState(1)
  const [appointmentType, setAppointmentType] = useState('campus')
  const [programmeId, setProgrammeId] = useState('')
  const minDate = useMemo(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Lagos', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())
    const next = new Date(`${today}T12:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) next.setUTCDate(next.getUTCDate() + 1)
    return next.toISOString().slice(0,10)
  }, [])

  useEffect(() => {
    if (!date) { setSlots([]); setSelectedTime(''); setSlotError(''); return }
    const day = new Date(`${date}T12:00:00Z`)
    if (day.getDay() === 0 || day.getDay() === 6) { setSlots([]); setSelectedTime(''); setSlotError('Appointments are available Monday to Friday. Please choose a weekday.'); return }
    let active = true
    setLoadingSlots(true); setSelectedTime(''); setSlotError('')
    fetch(`/api/admissions/availability?date=${encodeURIComponent(date)}`, { cache: 'no-store' })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to load available times.') ; return result })
      .then((result) => { if (active) { setSlots(result.slots ?? []); if (!(result.slots ?? []).length) setSlotError('No times are available on this date. Please try another weekday.') } })
      .catch(() => { if (active) setSlotError('Availability is temporarily unavailable. Please try again.') })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [date])

  if (state.ok) return <div className="rounded-3xl border p-7 sm:p-10 text-center" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}>
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(30,126,83,.1)', color: '#1e7e53' }}><CheckCircle2 size={32} /></div>
    <p className="eyebrow justify-center">Booking confirmed</p><h2 className="h-section mt-3">You’re one step closer.</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-7" style={{ color: 'var(--color-muted)' }}>{state.message}</p>
    {state.reference && <div className="mx-auto mt-6 max-w-sm rounded-xl border px-5 py-4" style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-alt)' }}><p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Booking reference</p><p className="mt-1 text-xl font-bold tracking-wide" style={{ color: 'var(--color-ink)' }}>{state.reference}</p></div>}
    {state.manageUrl && <a href={state.manageUrl} className="btn btn-secondary mt-4 inline-flex">Manage or cancel this booking</a>}
    <p className="mt-5 text-sm" style={{ color: 'var(--color-muted)' }}>A confirmation email is sent when email delivery is configured.</p>
    <a href="/" className="btn btn-primary mt-7 inline-flex">Back to home</a>
  </div>

  return <form action={action} aria-label="Book an admissions consultation" className="consultation-booking rounded-3xl border p-5 sm:p-7 lg:p-9" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)', boxShadow: '0 10px 34px rgba(11,23,71,.07)' }}>
    <div className="mb-8 flex items-center gap-3" aria-label={`Step ${step} of 3`}>
      {[1,2,3].map((item) => <div key={item} className="flex flex-1 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: step >= item ? 'var(--color-navy-900, #1d1250)' : 'var(--color-paper-alt)', color: step >= item ? '#fff' : 'var(--color-muted)', border: '1px solid var(--color-line)' }}>{item}</span><span className="hidden text-xs font-semibold sm:block" style={{ color: step === item ? 'var(--color-ink)' : 'var(--color-muted)' }}>{['Your session','Choose a time','Your details'][item-1]}</span>{item < 3 && <span className="h-px flex-1" style={{ background: 'var(--color-line)' }} />}</div>)}
    </div>
    {state.message && !state.ok && <div role="alert" className="mb-5 rounded-xl border px-4 py-3 text-sm" style={{ color: '#a52a2a', borderColor: 'rgba(165,42,42,.25)', background: 'rgba(165,42,42,.06)' }}>{state.message}</div>}
    {step === 1 && <section>
      <p className="eyebrow">Step 1 · Session type</p><h2 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>How would you like to meet?</h2><p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>Choose the format that works best for you.</p>
      <fieldset className="mt-6"><legend className="sr-only">Choose a consultation format</legend><div className="grid gap-3">{types.map(({ value, label, detail, icon: Icon }) => <label key={value} className={`consultation-option ${appointmentType === value ? 'is-selected' : ''}`}><input type="radio" name="appointmentTypeChoice" value={value} required checked={appointmentType === value} onChange={() => setAppointmentType(value)} /><span className="consultation-option-icon" aria-hidden="true"><Icon size={21}/></span><span className="consultation-option-copy"><span className="consultation-option-title">{label}</span><span className="consultation-option-detail">{detail}</span></span><span className="consultation-option-check" aria-hidden="true">{appointmentType === value && <Check size={16}/>}</span></label>)}</div></fieldset>
      <label className="mt-6 block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Programme you’re interested in <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional)</span><select name="programmeChoice" className="form-input consultation-control mt-2 w-full" value={programmeId} onChange={(e) => setProgrammeId(e.target.value)}><option value="">Help me choose a programme</option>{programmes.map((p) => <option key={p.id} value={p.id}>{p.name}{p.duration ? ` · ${p.duration}` : ''}</option>)}</select></label>
      <button type="button" className="btn btn-primary mt-7 flex w-full items-center justify-center gap-2" onClick={() => setStep(2)}>Choose a date and time <ArrowRight size={17}/></button>
    </section>}
    {step === 2 && <section>
      <input type="hidden" name="appointmentType" value={appointmentType} /><input type="hidden" name="programmeId" value={programmeId} />
      <p className="eyebrow">Step 2 · Availability</p><h2 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Find a time that suits you.</h2><p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>Appointments run Monday to Friday, 9:00am–4:00pm (WAT).</p>
      <label className="mt-6 block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Preferred date<input type="date" name="appointmentDate" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} required className="form-input consultation-control mt-2 w-full" /></label>
      <input type="hidden" name="appointmentTime" value={selectedTime} />
      {loadingSlots && <p role="status" aria-live="polite" className="mt-5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}><Clock3 size={16}/> Checking live availability…</p>}
      {slotError && !loadingSlots && <p role="status" className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--color-paper-alt)', color: 'var(--color-muted)' }}>{slotError}</p>}
      {slots.length > 0 && <><p className="mt-6 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Available times · West Africa Time</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((slot) => <button key={slot} type="button" onClick={() => setSelectedTime(slot)} className="rounded-xl border px-2 py-3 text-sm font-semibold transition" aria-pressed={selectedTime === slot} style={{ borderColor: selectedTime === slot ? '#1d1250' : 'var(--color-line)', background: selectedTime === slot ? '#1d1250' : 'var(--color-paper)', color: selectedTime === slot ? '#fff' : 'var(--color-ink)' }}>{slot}</button>)}</div></>}
      <div className="mt-7 flex gap-3"><button type="button" className="btn btn-secondary flex-1" onClick={() => setStep(1)}>Back</button><button type="button" className="btn btn-primary flex flex-1 items-center justify-center gap-2" disabled={!date || !selectedTime || loadingSlots} onClick={() => setStep(3)}>Your details <ArrowRight size={17}/></button></div>
    </section>}
    {step === 3 && <section>
      <input type="hidden" name="appointmentType" value={appointmentType} /><input type="hidden" name="programmeId" value={programmeId} /><input type="hidden" name="appointmentDate" value={date} />
      <p className="eyebrow">Step 3 · Your details</p><h2 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Who should we expect?</h2><p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>We’ll use these details to confirm your appointment.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold sm:col-span-2" style={{ color: 'var(--color-ink)' }}>Full name<input name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="form-input consultation-control mt-2 w-full" placeholder="Your full name" /></label><label className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Email address<input name="email" required type="email" maxLength={254} autoComplete="email" className="form-input consultation-control mt-2 w-full" placeholder="you@example.com" /></label><label className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Phone number<input name="phone" required type="tel" minLength={7} maxLength={30} autoComplete="tel" className="form-input consultation-control mt-2 w-full" placeholder="e.g. 080…" /></label><label className="text-sm font-semibold sm:col-span-2" style={{ color: 'var(--color-ink)' }}>Anything you’d like us to know? <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(optional)</span><textarea name="notes" maxLength={1000} rows={3} className="form-input consultation-control mt-2 w-full" placeholder="Ask about course options, schedules, fees…" /></label></div>
      <div className="mt-5 flex items-start gap-2 rounded-xl p-3 text-xs leading-5" style={{ background: 'var(--color-paper-alt)', color: 'var(--color-muted)' }}><ShieldCheck size={17} className="mt-0.5 shrink-0"/>Your details are used to arrange your admissions consultation and follow up on your request.</div>
      <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Leave blank<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      <div className="mt-7 flex gap-3"><button type="button" className="btn btn-secondary flex-1" onClick={() => setStep(2)} disabled={pending}>Back</button><button type="submit" className="btn btn-primary flex flex-1 items-center justify-center gap-2" disabled={pending}>{pending ? 'Booking…' : 'Confirm booking'} {!pending && <ArrowRight size={17}/>}</button></div>
    </section>}
    <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-muted)' }}>By booking, you agree that APTECH Abeokuta may contact you about this appointment.</p>
  </form>
}
