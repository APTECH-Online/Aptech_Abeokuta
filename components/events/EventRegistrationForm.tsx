'use client'
import { useState } from 'react'
export default function EventRegistrationForm({events}:{events:{id:string;title:string;starts_at:string}[]}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[ok,setOk]=useState(false)
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);const payload:any=Object.fromEntries(f.entries());payload.registration_consent=f.get('registration_consent')==='on';payload.marketing_consent=f.get('marketing_consent')==='on';try{const r=await fetch('/api/events/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();setOk(r.ok);setMessage(d.message||'Please try again.');if(r.ok)e.currentTarget.reset()}catch{setOk(false);setMessage('Registration is temporarily unavailable.')}finally{setBusy(false)}}
 return <form onSubmit={submit} className="form-card grid gap-4">
 <div><label className="form-label" htmlFor="event_id">Choose an event *</label><select required id="event_id" name="event_id" className="form-input" defaultValue=""><option value="" disabled>Select a workshop or event</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} — {new Date(e.starts_at).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})}</option>)}</select></div>
 <div><label className="form-label" htmlFor="full_name">Full name *</label><input className="form-input" id="full_name" name="full_name" autoComplete="name" maxLength={160} required/></div>
 <div><label className="form-label" htmlFor="email">Email address *</label><input className="form-input" id="email" name="email" type="email" autoComplete="email" required maxLength={254}/></div>
 <div><label className="form-label" htmlFor="phone">Phone / WhatsApp (optional)</label><input className="form-input" id="phone" name="phone" autoComplete="tel" maxLength={40}/></div>
 <div><label className="form-label" htmlFor="interest">What are you interested in?</label><select className="form-input" name="interest" id="interest"><option value="general">Explore technology</option><option value="coding">Introductory coding</option><option value="career">Technology careers</option><option value="programme">Choosing a programme</option><option value="admissions">Admissions and fees</option></select></div>
 <div><label className="form-label" htmlFor="preferred_contact">Preferred contact method</label><select className="form-input" id="preferred_contact" name="preferred_contact"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option><option value="none">Do not contact me after registration</option></select></div>
 <label className="flex items-start gap-3 text-sm"><input required type="checkbox" name="registration_consent" className="mt-1"/><span>I agree that APTECH Abeokuta may use these details to manage my registration and provide event-related information. *</span></label>
 <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="marketing_consent" className="mt-1"/><span>I would also like to receive optional programme and admissions updates. I can opt out later.</span></label>
 <button disabled={busy||events.length===0} className="btn btn-primary w-full" type="submit">{busy?'Submitting…':'Register for an event'}</button>
 {message&&<p role="status" className="text-sm" style={{color:ok?'var(--color-success, #16803c)':'var(--color-body)'}}>{message}</p>}
 <p className="text-xs" style={{color:'var(--color-muted)'}}>Registration is not an application for admission. Marketing updates are optional and separate from event registration.</p>
 </form>
}
