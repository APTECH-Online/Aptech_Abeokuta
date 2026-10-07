'use client'
import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { captureLegacyTechIqLead } from '../../app/(site)/tech-zone/actions'
import { getAttributionSnapshot } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'
import { LeadFormFields, LeadFormStatus } from '../tech-zone/LeadFormFields'
import LeadFormDialog from '../tech-zone/LeadFormDialog'
export default function TechIqLeadCapture({score}:{score:number}){
  const [open,setOpen]=useState(false)
  const [message,setMessage]=useState('')
  const [saved,setSaved]=useState(false)
  const [pending,startTransition]=useTransition()
  return <>
    <button type="button" className="btn btn-secondary" onClick={()=>setOpen(true)}>{saved?'Result sent':'Get my full result'}</button>
    {open&&<LeadFormDialog eyebrow="Save your result" title="Want your full result and programme recommendations?" description="We'll use your details to send your result and, if relevant, help you explore suitable Aptech programmes." onClose={()=>setOpen(false)}>
      <form className="lead-form" action={fd=>startTransition(async()=>{
        setMessage('')
        fd.set('attribution',JSON.stringify(getAttributionSnapshot()))
        const r=await captureLegacyTechIqLead(fd)
        if(!r.ok){setSaved(false);setMessage(r.message ?? 'We could not save your result right now.');return}
        trackConversionEvent('challenge_lead_captured',{challenge:'tech_iq',score})
        setSaved(true)
        setMessage('Your result has been saved. Our team can now see your challenge context.')
      })}>
        <input type="hidden" name="score" value={score}/>
        <input type="hidden" name="attribution" value="{}"/>
        {saved ? null : <LeadFormFields/>}
        <LeadFormStatus message={message} tone={saved?'success':'error'}/>
        <div className="lead-form__actions">
          {saved
            ? <button type="button" className="btn btn-primary" onClick={()=>setOpen(false)}>Done</button>
            : <button disabled={pending} className="btn btn-primary">{pending?'Saving…':'Send my result'} <Check size={15}/></button>}
        </div>
      </form>
    </LeadFormDialog>}
  </>
}
