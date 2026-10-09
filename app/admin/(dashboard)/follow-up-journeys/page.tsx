import Link from 'next/link'
import { guardAdminPage } from '../../../../lib/auth'
import { hasAnyModulePermission } from '../../../../lib/permissions'
import { createClient } from '../../../../lib/supabase/server'
import { ArrowRight, CheckCircle2, Clock3, Mail, MessageCircle, Phone, ShieldCheck, Workflow } from 'lucide-react'

export const metadata = { title: 'Behaviour-Based Journeys | Admissions CRM' }
export const dynamic = 'force-dynamic'

const channelIcon: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageCircle, phone: Phone, manual: ShieldCheck }
const channelLabel: Record<string, string> = { email: 'Email', whatsapp: 'WhatsApp', phone: 'Phone', manual: 'Staff task' }

export default async function FollowUpJourneysPage() {
  await guardAdminPage((s) => s.role === 'super_admin' || s.role === 'admissions_officer' || hasAnyModulePermission(s, 'follow_ups'))
  const supabase = await createClient()
  const [{ data: journeys, error: journeyError }, { data: queue, error: queueError }] = await Promise.all([
    supabase.from('follow_up_journeys').select('*').order('created_at'),
    supabase.from('follow_up_journey_enrolments').select('id,status,journey_id,due_at,channel,suppression_reason').order('due_at').limit(500)
  ])
  const configured = journeys ?? []
  const entries = queue ?? []
  const count = (status: string) => entries.filter((e: any) => e.status === status).length
  return <div className="grid gap-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Lead nurturing & conversion</p><h1 className="h-section mt-1">Behaviour-based journeys</h1><p className="mt-2 max-w-3xl text-sm" style={{color:'var(--color-muted)'}}>Relevant next steps based on what a prospect did — not one generic follow-up for everyone.</p></div>
      <Link href="/admin/follow-ups" className="btn btn-secondary btn-sm self-start sm:self-auto">Open follow-up tasks <ArrowRight size={15}/></Link>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[{label:'Journeys configured',value:configured.length,icon:Workflow},{label:'Queued',value:count('queued'),icon:Clock3},{label:'Sent',value:count('sent'),icon:CheckCircle2},{label:'Suppressed',value:count('suppressed'),icon:ShieldCheck}].map((item)=>{const Icon=item.icon;return <div key={item.label} className="card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm" style={{color:'var(--color-muted)'}}>{item.label}</p><Icon size={18} style={{color:'var(--color-muted)'}}/></div><p className="mt-3 text-2xl font-semibold">{item.value}</p></div>})}
    </div>
    {(journeyError || queueError) && <div className="card p-4 text-sm" style={{borderColor:'var(--color-warning)',color:'var(--color-ink)'}}>The journey tables are not available yet. Apply migration <code>0036_behaviour_based_follow_up_journeys.sql</code> in Supabase, then refresh this page.</div>}
    <div className="grid gap-4 lg:grid-cols-2">
      {configured.map((journey:any)=>{const Icon=channelIcon[journey.recommended_channel]||Mail;const journeyEntries=entries.filter((e:any)=>e.journey_id===journey.id);return <section key={journey.id} className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl p-3" style={{background:'var(--color-surface-soft, var(--color-border))'}}><Icon size={20}/></div><div><h2 className="font-semibold">{journey.name}</h2><p className="mt-1 text-sm" style={{color:'var(--color-muted)'}}>{journey.description}</p></div></div><span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{background:journey.is_active?'rgba(34,197,94,.12)':'var(--color-border)',color:journey.is_active?'var(--color-success)':'var(--color-muted)'}}>{journey.is_active?'Active':'Paused'}</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg p-3" style={{background:'var(--color-surface-soft, var(--color-border))'}}><p style={{color:'var(--color-muted)'}}>Trigger</p><p className="mt-1 font-medium">{journey.trigger_event.replaceAll('_',' ')}</p></div><div className="rounded-lg p-3" style={{background:'var(--color-surface-soft, var(--color-border))'}}><p style={{color:'var(--color-muted)'}}>Next step</p><p className="mt-1 font-medium">{channelLabel[journey.recommended_channel]||journey.recommended_channel} · {journey.delay_minutes < 60 ? `${journey.delay_minutes} min` : `${Math.round(journey.delay_minutes/60)} hr`}</p></div></div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span style={{color:'var(--color-muted)'}}>Queue records: {journeyEntries.length}</span><span className="font-medium">{journeyEntries.filter((e:any)=>e.status==='queued').length} awaiting</span></div>
        <details className="mt-4 border-t pt-4" style={{borderColor:'var(--color-border)'}}><summary className="cursor-pointer text-sm font-medium">Preview follow-up message</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{color:'var(--color-muted)'}}>{journey.message_template}</p></details>
      </section>})}
    </div>
    <section className="card p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0"/><div><h2 className="font-semibold">Consent and contact safeguards</h2><ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2" style={{color:'var(--color-muted)'}}><li>• Only contact prospects through their permitted channel.</li><li>• Re-check marketing consent and opt-out status immediately before sending.</li><li>• Respect a preference of “none” and suppress opted-out contacts.</li><li>• Keep unanswered enquiries as staff tasks until a human response is recorded.</li><li>• Avoid duplicate enrolments for the same prospect and journey.</li><li>• Log each send, suppression, and completion for auditability.</li></ul><p className="mt-4 text-xs" style={{color:'var(--color-muted)'}}>This page configures and monitors journeys. Actual automatic detection, scheduled queue processing, and email/WhatsApp delivery require a server-side worker and a connected messaging provider; no messages are sent from this dashboard.</p></div></div></section>
  </div>
}
