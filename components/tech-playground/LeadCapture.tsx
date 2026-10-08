'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { capturePlaygroundLead } from '../../app/(site)/tech-playground/actions'
import { LeadFormFields, LeadFormStatus } from '../tech-zone/LeadFormFields'
import { getAttributionSnapshot } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function LeadCapture({ token, activityId, heading = 'Want us to send you your personalised career roadmap?' }: { token: string; activityId: string; heading?: string }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()
  if (done) return <div className="pg-panel pg-panel--ok" role="status"><strong>Thank you!</strong><p>An APTECH advisor will be in touch using your preferred method. Your phone number was optional and is only used if you gave it.</p></div>
  if (!open) return <div className="pg-panel"><h3 className="pg-h3">{heading}</h3><p className="pg-muted">Optional. Share your details and we will send your roadmap.</p><button className="btn btn-accent mt-3" onClick={() => setOpen(true)}>Send me my roadmap</button></div>
  return (
    <form className="pg-panel lead-form" action={(fd: FormData) => start(async () => {
      setMsg('')
      const r = await capturePlaygroundLead(fd)
      if (!r.ok) { setMsg(r.message); return }
      trackConversionEvent('playground_lead_captured'); setDone(true)
    })}>
      <h3 className="pg-h3">{heading}</h3>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="attribution" value={JSON.stringify(getAttributionSnapshot() || {})} />
      <LeadFormFields showPreference />
      <LeadFormStatus message={msg} tone="error" />
      <div className="lead-form__actions"><button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Send my roadmap'} <Check size={15} /></button></div>
    </form>
  )
}
