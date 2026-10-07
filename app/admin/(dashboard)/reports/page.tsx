import { guardAdminPage, guardPage } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions'
import { getAdmissionsAnalytics, resolveAnalyticsRange, type AnalyticsRangeKey } from '../../../../lib/crm/analytics'
import { BarChart, MultiLineChart, DonutChart } from '../../../../components/admin/charts'
import { Users, FileText, GraduationCap, Percent, Clock3, TrendingUp, UserCheck, MousePointerClick } from 'lucide-react'
import KpiCard from '../../../../components/admin/KpiCard'
import Link from 'next/link'

export const metadata = { title: 'Admissions & Sales Analytics | Admissions CRM' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
function one(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] : v }
function change(value: number | null) { return value === null ? 'No comparison data' : `${value > 0 ? '+' : ''}${value}% vs previous period` }
function formatPct(v: number | null) { return v === null ? '—' : `${v}%` }

export default async function ReportsPage({ searchParams }: Props) {
  await guardAdminPage((s) => s.role === 'super_admin' || s.role === 'admissions_officer' || (hasPermission(s, 'dashboard_access') && hasPermission(s, 'dashboard_view_reports') && hasPermission(s, 'dashboard_view_admissions_stats')))
  const params = await searchParams
  const key = (one(params.range) || 'this_month') as AnalyticsRangeKey
  const range = resolveAnalyticsRange(key, one(params.from), one(params.to))
  const data = await guardPage(getAdmissionsAnalytics(range))
  const query = (next: string) => `/admin/reports?range=${next}`

  return (
    <div className="grid gap-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="eyebrow">Admissions &amp; Sales Analytics</p>
          <h1 className="h-section mt-1">Performance overview</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>Decision-ready reporting from the existing lead → application → enrollment funnel.</p>
        </div>
        <div className="card p-3 flex flex-wrap gap-2 items-center">
          {([['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['this_month','This month'],['last_month','Last month'],['this_quarter','This quarter'],['this_year','This year']] as const).map(([value,label]) => (
            <Link key={value} href={query(value)} className={`btn btn-sm ${range.key === value ? 'btn-primary' : 'btn-ghost'}`}>{label}</Link>
          ))}
          <form className="flex flex-wrap items-center gap-2 ml-1" action="/admin/reports">
            <input type="hidden" name="range" value="custom" />
            <label className="sr-only" htmlFor="from">From</label><input id="from" name="from" type="date" className="admin-select" defaultValue={range.key === 'custom' ? range.start.toISOString().slice(0,10) : ''} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>to</span>
            <label className="sr-only" htmlFor="to">To</label><input id="to" name="to" type="date" className="admin-select" defaultValue={range.key === 'custom' ? range.end.toISOString().slice(0,10) : ''} />
            <button className="btn btn-secondary btn-sm" type="submit">Apply</button>
          </form>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3"><p className="eyebrow">Selected period</p><span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{range.label}</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total leads" value={data.totals.leads} sub={change(data.comparison.leadChange)} icon={Users} />
          <KpiCard label="New leads" value={data.totals.newLeads} icon={UserCheck} tone="success" />
          <KpiCard label="Contacted" value={data.totals.contacted} icon={TrendingUp} />
          <KpiCard label="Interested" value={data.totals.interested} icon={UserCheck} tone="success" />
          <KpiCard label="Applications" value={data.totals.applications} sub={change(data.comparison.applicationChange)} icon={FileText} />
          <KpiCard label="Enrolled" value={data.totals.enrolled} sub={change(data.comparison.enrolledChange)} icon={GraduationCap} tone="success" />
          <KpiCard label="Lead → enrollment" value={formatPct(data.totals.conversion)} sub={`${data.totals.enrolled} enrolled from ${data.totals.leads} leads`} icon={Percent} tone="success" progress={data.totals.conversion ?? 0} />
          <KpiCard label="Lead → application" value={formatPct(data.totals.leadToApplication)} sub="Applications ÷ leads" icon={FileText} />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-4">Lead funnel</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {data.funnel.map((stage, i) => <div key={stage.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}><p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{stage.count}</p><p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-body)' }}>{stage.label}</p><p className="text-[0.68rem] mt-2" style={{ color: 'var(--color-muted)' }}>{i === 0 ? '100% of leads' : `${formatPct(stage.previousPct)} of previous · ${formatPct(stage.overallPct)} overall`}</p></div>)}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Conversion trends</p><MultiLineChart data={data.trends} /></div>
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Current lead status distribution</p><DonutChart data={data.statuses.map(s => ({label:s.status,value:s.count}))} /></div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4"><div><p className="eyebrow">Where are our leads coming from?</p><p className="text-sm mt-1" style={{color:'var(--color-muted)'}}>Source attribution is preserved through the existing lead → application → enrollment relationship.</p></div></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Leads</th><th className="py-3 pr-4">Applications</th><th className="py-3 pr-4">Enrolled</th><th className="py-3">Conversion</th></tr></thead><tbody>{data.sources.map(s=><tr key={s.source} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4 font-semibold">{s.source}</td><td className="py-3 pr-4">{s.leads}</td><td className="py-3 pr-4">{s.applications}</td><td className="py-3 pr-4">{s.enrolled}</td><td className="py-3">{formatPct(s.conversion)}</td></tr>)}</tbody></table></div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Programme performance</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-3">Programme</th><th className="py-3 pr-3">Leads</th><th className="py-3 pr-3">Apps</th><th className="py-3 pr-3">Enrolled</th><th className="py-3">Lead → enrolled</th></tr></thead><tbody>{data.programmes.map(p=><tr key={p.programme} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-3 font-semibold">{p.programme}</td><td className="py-3 pr-3">{p.leads}</td><td className="py-3 pr-3">{p.applications}</td><td className="py-3 pr-3">{p.enrolled}</td><td className="py-3">{formatPct(p.leadToEnrollment)}</td></tr>)}</tbody></table></div></div>
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Most requested programmes</p><BarChart data={data.demand.map(p=>({label:p.programme,value:p.count}))} /></div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4"><div><p className="eyebrow">Marketing campaigns</p><h2 className="font-display font-semibold text-lg mt-1">Campaign performance</h2><p className="text-sm mt-1" style={{color:'var(--color-muted)'}}>Leads are attributed from the existing first/last-touch campaign context. No visitor or spend numbers are invented.</p></div><a href="/admin/campaigns" className="btn btn-secondary btn-sm">Manage campaigns</a></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Campaign</th><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Programme</th><th className="py-3 pr-4">Leads</th><th className="py-3 pr-4">Applications</th><th className="py-3 pr-4">Enrollments</th><th className="py-3">Conversion</th></tr></thead><tbody>{data.campaigns.map(c=><tr key={c.id} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4"><strong>{c.name}</strong><span className="block text-xs" style={{color:'var(--color-muted)'}}>{c.identifier}</span></td><td className="py-3 pr-4">{c.source}{c.medium&&<span className="block text-xs" style={{color:'var(--color-muted)'}}>{c.medium}</span>}</td><td className="py-3 pr-4">{c.programme}</td><td className="py-3 pr-4">{c.leads}</td><td className="py-3 pr-4">{c.applications}</td><td className="py-3 pr-4">{c.enrolled}</td><td className="py-3">{formatPct(c.conversion)}</td></tr>)}</tbody></table>{data.campaigns.length===0&&<div className="py-8 text-sm" style={{color:'var(--color-muted)'}}>No attributed campaign conversions in this period yet.</div>}</div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Source performance</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Leads</th><th className="py-3 pr-4">Applications</th><th className="py-3 pr-4">Enrollments</th><th className="py-3">Conversion</th></tr></thead><tbody>{data.sourcePerformance.map(x=><tr key={x.source} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4 font-semibold">{x.source}</td><td className="py-3 pr-4">{x.leads}</td><td className="py-3 pr-4">{x.applications}</td><td className="py-3 pr-4">{x.enrolled}</td><td className="py-3">{formatPct(x.conversion)}</td></tr>)}</tbody></table></div></div>
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Marketing funnel</p><div className="grid gap-3">{data.marketingFunnel.map((x,i)=><div key={x.label} className="flex items-center justify-between gap-4 rounded-xl border p-4" style={{borderColor:'var(--color-border)'}}><div><p className="font-semibold">{x.label}</p><p className="text-xs mt-1" style={{color:'var(--color-muted)'}}>{x.note}</p></div><p className="text-xl font-bold">{x.count==null?'—':x.count}</p></div>)}</div></div>
      </section>

      <section className="card p-5 sm:p-6"><p className="eyebrow mb-4">Interactive engagement performance</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{data.interactive.map(x=><div key={x.experience} className="rounded-xl border p-4" style={{borderColor:'var(--color-border)'}}><div className="flex items-center gap-2"><MousePointerClick size={16}/><p className="font-semibold">{x.experience}</p></div><div className="grid grid-cols-2 gap-3 mt-4 text-sm"><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Starts</span><p className="font-bold">{x.starts}</p></div><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Completions</span><p className="font-bold">{x.completions}</p></div><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Completion rate</span><p className="font-bold">{formatPct(x.completionRate)}</p></div><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Leads</span><p className="font-bold">{x.leads}</p></div><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Applications</span><p className="font-bold">{x.applications}</p></div><div><span className="text-xs" style={{color:'var(--color-muted)'}}>Enrolled</span><p className="font-bold">{x.enrolled}</p></div></div></div>)}</div></section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Follow-up overview</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{[['Due today',data.followUps.dueToday],['Completed today',data.followUps.completedToday],['Upcoming',data.followUps.upcoming],['Overdue',data.followUps.overdue],['Without follow-up',data.followUps.withoutFollowUp],['Without recent activity',data.followUps.withoutRecentActivity]].map(([label,value])=><div key={String(label)}><p className="text-2xl font-bold">{value}</p><p className="text-xs mt-1" style={{color:'var(--color-muted)'}}>{label}</p></div>)}</div><div className="mt-5 flex items-center gap-2"><Clock3 size={16}/><span className="text-sm">Completion rate: <strong>{formatPct(data.followUps.completionRate)}</strong></span></div></div>
        <div className="card p-5 sm:p-6"><p className="eyebrow mb-4">Lost lead reasons</p>{data.lostReasons.length===0 ? <div className="py-8 text-sm" style={{color:'var(--color-muted)'}}>No recorded lost reasons in this period.</div> : <BarChart data={data.lostReasons.map(x=>({label:x.reason,value:x.count}))}/>}</div>
      </section>

      <section className="card p-5 sm:p-6"><p className="eyebrow mb-4">Staff operational performance</p>{data.staff.length===0 ? <div className="py-8 text-sm" style={{color:'var(--color-muted)'}}>Not enough staff activity data yet.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Staff</th><th className="py-3 pr-4">Leads</th><th className="py-3 pr-4">Contacted</th><th className="py-3 pr-4">Follow-ups</th><th className="py-3 pr-4">Applications</th><th className="py-3">Enrolled</th></tr></thead><tbody>{data.staff.map(s=><tr key={s.staff} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4 font-semibold">{s.staff}</td><td className="py-3 pr-4">{s.leads}</td><td className="py-3 pr-4">{s.contacted}</td><td className="py-3 pr-4">{s.followUpsCompleted}</td><td className="py-3 pr-4">{s.applications}</td><td className="py-3">{s.enrolled}</td></tr>)}</tbody></table></div>}</section>

      <section className="card p-5 sm:p-6"><p className="eyebrow mb-4">Source vs programme</p>{data.sourceProgramme.length===0 ? <div className="py-8 text-sm" style={{color:'var(--color-muted)'}}>Not enough attribution data yet.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b" style={{borderColor:'var(--color-border)'}}><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Programme</th><th className="py-3">Leads</th></tr></thead><tbody>{data.sourceProgramme.slice(0,40).map((x,i)=><tr key={`${x.source}-${x.programme}-${i}`} className="border-b last:border-0" style={{borderColor:'var(--color-border)'}}><td className="py-3 pr-4">{x.source}</td><td className="py-3 pr-4 font-semibold">{x.programme}</td><td className="py-3">{x.leads}</td></tr>)}</tbody></table></div>}</section>

      <p className="text-xs" style={{color:'var(--color-muted)'}}>Analytics use event dates appropriate to each metric: leads by lead creation, applications by application creation, enrollments by the application enrollment event, and follow-ups by due/completion dates. Where historical event data was not previously captured, the dashboard does not invent it.</p>
    </div>
  )
}
