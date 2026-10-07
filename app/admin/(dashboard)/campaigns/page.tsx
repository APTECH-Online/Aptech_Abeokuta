import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server'
import { requireCampaignAccess, getCampaigns, CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS, CAMPAIGN_GOAL_LABELS } from '../../../../lib/campaigns'
import { getCampaignPerformance } from '../../../../lib/campaigns'
import { getCampaignBySlug } from '../../../../lib/campaigns'
import type { Programme } from '../../../../types/db'
import CampaignForm from '../../../../components/admin/CampaignForm'
import StatusBadge from '../../../../components/admin/StatusBadge'

export const metadata={title:'Marketing Campaigns | Admissions CRM'}
export const dynamic='force-dynamic'

export default async function CampaignsPage(){
  await requireCampaignAccess('view')
  const supabase=await createClient()
  const [{data:programmes},{data:campaigns}]=await Promise.all([supabase.from('programmes').select('*').order('display_order'), supabase.from('campaigns').select('*, programmes:programme_id(id,name)').order('created_at',{ascending:false})])
  const rows=campaigns??[]
  return <div className="grid gap-6">
    <div><p className="eyebrow">Acquisition & conversion</p><h1 className="h-section mt-1">Marketing campaigns</h1><p className="mt-1 text-sm max-w-3xl" style={{color:'var(--color-muted)'}}>Create campaigns, preserve first- and last-touch attribution, and connect acquisition to leads, applications and enrollment through the existing CRM.</p></div>
    <section className="card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">New campaign</p><h2 className="font-display font-semibold text-lg mt-1">Set up an acquisition campaign</h2></div></div><div className="mt-5"><CampaignForm programmes={(programmes??[]) as Programme[]}/></div></section>
    <section className="card p-5 sm:p-6"><div className="flex items-center justify-between gap-3 mb-4"><div><p className="eyebrow">Campaign inventory</p><h2 className="font-display font-semibold text-lg mt-1">All campaigns</h2></div><Link href="/admin/reports?section=campaigns" className="btn btn-secondary btn-sm">View performance</Link></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Campaign</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Programme</th><th className="py-3 pr-4">Goal</th><th className="py-3 pr-4">Status</th><th className="py-3"></th></tr></thead><tbody>{rows.map((c:any)=><tr key={c.id} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4"><p className="font-semibold">{c.name}</p><p className="text-xs mt-1" style={{color:'var(--color-muted)'}}>{c.campaign_identifier}</p></td><td className="py-3 pr-4">{CAMPAIGN_TYPE_LABELS[c.campaign_type as keyof typeof CAMPAIGN_TYPE_LABELS]}</td><td className="py-3 pr-4">{c.programmes?.name||'All programmes'}</td><td className="py-3 pr-4">{CAMPAIGN_GOAL_LABELS[c.conversion_goal as keyof typeof CAMPAIGN_GOAL_LABELS]}</td><td className="py-3 pr-4"><StatusBadge status={c.status} label={CAMPAIGN_STATUS_LABELS[c.status as keyof typeof CAMPAIGN_STATUS_LABELS]}/></td><td className="py-3 text-right"><Link href={`/admin/campaigns/${c.id}`} className="btn btn-secondary btn-sm">Open</Link></td></tr>)}</tbody></table>{rows.length===0&&<div className="py-10 text-center text-sm" style={{color:'var(--color-muted)'}}>No campaigns yet.</div>}</div></section>
  </div>
}
