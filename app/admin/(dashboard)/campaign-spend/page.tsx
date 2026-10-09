import Link from 'next/link'
import { requireStaff, ForbiddenError } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { saveCampaignSpend } from './actions'

export const metadata = { title: 'Campaign Spend | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function CampaignSpendPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const staff = await requireStaff()
  if (!['super_admin', 'admissions_officer'].includes(staff.role)) throw new ForbiddenError()
  const params = await searchParams
  const admin = createAdminClient()
  const [{ data: campaigns }, { data: spend }] = await Promise.all([
    admin.from('campaigns').select('id,name,campaign_identifier').order('name'),
    admin.from('campaign_spend').select('id,campaign_id,spend_date,amount,currency,source_note,created_at,campaigns:campaign_id(name,campaign_identifier)').order('spend_date', { ascending: false }).limit(100)
  ])
  return <div className="grid gap-6">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"><div><p className="eyebrow">Acquisition & conversion</p><h1 className="h-section mt-1">Campaign spend</h1><p className="mt-2 text-sm max-w-3xl" style={{color:'var(--color-muted)'}}>Enter actual campaign spend from reliable invoices or ad-platform reports. These amounts power cost per inquiry and cost per enrolment on reports.</p></div><Link href="/admin/reports" className="btn btn-secondary btn-sm">Back to reports</Link></div>
    {params.saved === '1' && <div className="rounded-xl border p-3 text-sm" style={{borderColor:'var(--color-border)'}}>Campaign spend saved and reports refreshed.</div>}
    {params.error && <div className="rounded-xl border p-3 text-sm" style={{borderColor:'var(--color-border)'}}>Could not save this entry. Check the campaign, date, amount, and currency, then try again.</div>}
    <section className="card p-5 sm:p-6"><p className="eyebrow mb-4">Record actual spend</p><form action={saveCampaignSpend} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <label className="grid gap-2 text-sm font-medium sm:col-span-2 xl:col-span-1">Campaign<select className="admin-select w-full" name="campaign_id" required defaultValue=""><option value="" disabled>Select campaign</option>{(campaigns??[]).map((c:any)=><option key={c.id} value={c.id}>{c.name} ({c.campaign_identifier})</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Spend date<input className="admin-select w-full" type="date" name="spend_date" required defaultValue={new Date().toISOString().slice(0,10)}/></label>
      <label className="grid gap-2 text-sm font-medium">Amount<input className="admin-select w-full" type="number" name="amount" min="0" step="0.01" required placeholder="e.g. 25000"/></label>
      <label className="grid gap-2 text-sm font-medium">Currency<select className="admin-select w-full" name="currency" defaultValue="NGN"><option value="NGN">NGN — Nigerian naira</option><option value="USD">USD — US dollar</option><option value="GBP">GBP — Pound sterling</option><option value="EUR">EUR — Euro</option></select></label>
      <label className="grid gap-2 text-sm font-medium">Source / note<input className="admin-select w-full" name="source_note" maxLength={500} placeholder="Invoice, Meta Ads, Google Ads…"/></label>
      <div className="sm:col-span-2 xl:col-span-5"><button className="btn btn-primary" type="submit">Save spend record</button><p className="text-xs mt-2" style={{color:'var(--color-muted)'}}>One record per campaign, date, and currency. Saving the same combination updates that day's amount.</p></div>
    </form></section>
    <section className="card p-5 sm:p-6"><p className="eyebrow mb-4">Recent spend records</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Campaign</th><th className="py-3 pr-4">Amount</th><th className="py-3">Note</th></tr></thead><tbody>{(spend??[]).map((row:any)=><tr key={row.id} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4">{row.spend_date}</td><td className="py-3 pr-4 font-semibold">{row.campaigns?.name??'Deleted campaign'}</td><td className="py-3 pr-4">{row.currency} {Number(row.amount).toLocaleString('en-NG',{maximumFractionDigits:2})}</td><td className="py-3">{row.source_note||'—'}</td></tr>)}</tbody></table>{(spend??[]).length===0&&<p className="py-6 text-sm" style={{color:'var(--color-muted)'}}>No spend records yet.</p>}</div></section>
  </div>
}
