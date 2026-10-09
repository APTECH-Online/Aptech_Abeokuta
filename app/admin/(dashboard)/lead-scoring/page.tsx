import { createClient } from '../../../../lib/supabase/server'
import { requireCrmAction } from '../../../../lib/auth'
import { saveLeadScoringRules } from './actions'

export const metadata = { title: 'Lead scoring | Admissions CRM' }
export const dynamic = 'force-dynamic'

const DEFAULT_RULES = [
  { event_name: 'programme_page_viewed', label: 'Programme page viewed', points: 5, enabled: true, max_occurrences: 5, hint: 'Repeat visits count, up to the configured cap.' },
  { event_name: 'programme_interest', label: 'Programme selected in enquiry', points: 10, enabled: true, max_occurrences: 1, hint: 'Uses an existing CRM programme-interest record.' },
  { event_name: 'career_quiz_completed', label: 'Career discovery quiz completed', points: 10, enabled: true, max_occurrences: 1, hint: 'Uses linked quiz results or a linked conversion event.' },
  { event_name: 'fee_inquiry', label: 'Fees / tuition inquiry', points: 20, enabled: true, max_occurrences: 1, hint: 'Strong intent to understand cost and payment.' },
  { event_name: 'consultation_booked', label: 'Consultation booked', points: 25, enabled: true, max_occurrences: 1, hint: 'A confirmed counselling booking is a strong signal.' },
  { event_name: 'application_completed', label: 'Application submitted', points: 50, enabled: true, max_occurrences: 1, hint: 'Highest-intent signal in the default model.' }
]

export default async function LeadScoringPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireCrmAction('enquiries', 'view')
  const params = await searchParams
  const supabase = await createClient()
  const [{ data: savedRules }, { data: savedSettings }] = await Promise.all([
    supabase.from('lead_scoring_rules').select('*').order('event_name'),
    supabase.from('lead_scoring_settings').select('*').eq('id', 1).maybeSingle()
  ])
  const rules = DEFAULT_RULES.map((rule) => ({ ...rule, ...(savedRules ?? []).find((saved: any) => saved.event_name === rule.event_name) }))
  const settings = savedSettings ?? { high_threshold: 50, medium_threshold: 20 }
  return <div className="grid gap-6">
    <div><p className="eyebrow">Admissions intelligence</p><h1 className="h-section mt-1">Intelligent lead scoring</h1><p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: 'var(--color-muted)' }}>Configure transparent points for real intent signals. Every lead score shows the events that contributed and the next recommended action; it is a prioritisation aid, not a guarantee of enrolment.</p></div>
    {params.saved && <div className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-alt)' }}>Scoring rules saved and existing leads recalculated.</div>}
    {params.error && <div role="alert" className="rounded-xl border p-3 text-sm" style={{ borderColor: '#e9b7b7', color: '#a32626' }}>{params.error === 'thresholds' ? 'Set a valid medium threshold below the high threshold.' : params.error === 'rules' ? 'Points must be 0–100 and occurrence caps must be 1–20.' : 'Could not save scoring settings. Please try again.'}</div>}
    <form action={saveLeadScoringRules} className="grid gap-6">
      <section className="card p-5 sm:p-6"><p className="eyebrow">Priority bands</p><h2 className="mt-1 font-display text-lg font-semibold">Score thresholds</h2><p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Scores are capped at 100. High priority is assigned at the high threshold; Medium at the medium threshold; lower scores are Low.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">High priority from<input type="number" min={1} max={1000} name="highThreshold" required defaultValue={settings.high_threshold} className="admin-input mt-2 w-full" /></label><label className="text-sm font-medium">Medium priority from<input type="number" min={0} max={999} name="mediumThreshold" required defaultValue={settings.medium_threshold} className="admin-input mt-2 w-full" /></label></div></section>
      <section className="card p-5 sm:p-6"><div><p className="eyebrow">Scoring model</p><h2 className="mt-1 font-display text-lg font-semibold">Intent signals</h2><p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Enable or disable a signal, set its point value and cap repeat events to avoid inflated scores.</p></div><div className="mt-5 grid gap-3">{rules.map((rule: any) => <div key={rule.event_name} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-line)' }}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{rule.label}</h3><p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{rule.hint}</p><p className="mt-1 font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{rule.event_name}</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`enabled_${rule.event_name}`} defaultChecked={rule.enabled} /> Enabled</label></div><div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md"><label className="text-sm">Points per signal<input type="number" min={0} max={100} name={`points_${rule.event_name}`} required defaultValue={rule.points} className="admin-input mt-1 w-full" /></label><label className="text-sm">Max occurrences<input type="number" min={1} max={20} name={`max_${rule.event_name}`} required defaultValue={rule.max_occurrences} className="admin-input mt-1 w-full" /></label></div></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs" style={{ color: 'var(--color-muted)' }}>Changes recalculate scores for existing leads and apply to new activity.</p><button className="btn btn-primary" type="submit">Save scoring rules</button></div></section>
    </form>
    <section className="card p-5 sm:p-6"><p className="eyebrow">Default action logic</p><h2 className="mt-1 font-display text-lg font-semibold">What staff should do next</h2><ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[{title:'Application submitted',text:'Contact the applicant today and help resolve outstanding steps.'},{title:'Consultation booked',text:'Confirm the appointment and prepare programme and fee answers.'},{title:'Fee inquiry',text:'Follow up on fees, payment options and the next available intake.'},{title:'Programme interest',text:'Ask which programme they are considering and offer a counselling call.'}].map(item=><li key={item.title} className="rounded-xl p-4" style={{ background: 'var(--color-paper-alt)' }}><strong>{item.title}</strong><p className="mt-1" style={{ color: 'var(--color-muted)' }}>{item.text}</p></li>)}</ul></section>
  </div>
}
