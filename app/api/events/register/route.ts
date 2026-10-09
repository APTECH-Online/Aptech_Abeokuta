import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { headers } from 'next/headers'
export async function POST(request: Request) {
 try {
  const h=await headers(); const ip=h.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'
  if(!checkRateLimit(`event-registration:${ip}`).allowed) return NextResponse.json({ok:false,message:'Please try again later.'},{status:429})
  const b=await request.json();
  const full_name=String(b.full_name||'').trim().slice(0,160), email=String(b.email||'').trim().toLowerCase().slice(0,254), phone=String(b.phone||'').trim().slice(0,40), event_id=String(b.event_id||''), interest=String(b.interest||'general').slice(0,120), preferred_contact=['email','phone','whatsapp','none'].includes(b.preferred_contact)?b.preferred_contact:'email'
  if(!full_name||!/^\S+@\S+\.\S+$/.test(email)||!event_id||b.registration_consent!==true) return NextResponse.json({ok:false,message:'Enter your name, a valid email, choose an event, and accept the registration notice.'},{status:400})
  const db=createAdminClient(); const {data:event}=await db.from('campus_events').select('id,title,registration_open,starts_at').eq('id',event_id).maybeSingle()
  if(!event||!event.registration_open||new Date(event.starts_at)<new Date()) return NextResponse.json({ok:false,message:'Registration for this event is closed.'},{status:400})
  const {error}=await db.from('event_registrations').upsert({event_id,full_name,email,phone:phone||null,interest,registration_consent:true,marketing_consent:b.marketing_consent===true,preferred_contact}, {onConflict:'event_id,email'})
  if(error) return NextResponse.json({ok:false,message:'We could not complete registration. Please try again.'},{status:500})
  return NextResponse.json({ok:true,message:'Registration received. We look forward to seeing you.'})
 } catch { return NextResponse.json({ok:false,message:'Registration is temporarily unavailable.'},{status:500}) }
}
