import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff, ForbiddenError } from '../auth'
import { hasPermission } from '../permissions'
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, type LeadSource, type LeadStatus } from '../../types/db'

export type AnalyticsRangeKey = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom'
export type AnalyticsRange = { key: AnalyticsRangeKey; start: Date; end: Date; label: string }

type LeadRow = { id: string; source: LeadSource; status: LeadStatus; created_at: string; assigned_to: string | null }
type ApplicationRow = { id: string; lead_id: string; programme_id: string | null; status: string; assigned_to: string | null; created_at: string; enrolled_at: string | null }
type FollowUpRow = { id: string; lead_id: string; assigned_to: string | null; due_date: string; status: string; completed_at: string | null }
type ProgrammeRow = { id: string; name: string }
type StaffRow = { id: string; full_name: string }
type EventRow = { event_name: string; lead_id: string | null; created_at: string }

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfQuarter(d: Date) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1) }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1) }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export function resolveAnalyticsRange(key: string | undefined, from?: string, to?: string, now = new Date()): AnalyticsRange {
  const today = startOfDay(now)
  switch (key) {
    case 'today': return { key: 'today', start: today, end: endOfDay(now), label: 'Today' }
    case '7d': return { key: '7d', start: addDays(today, -6), end: endOfDay(now), label: 'Last 7 days' }
    case '30d': return { key: '30d', start: addDays(today, -29), end: endOfDay(now), label: 'Last 30 days' }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return { key: 'last_month', start, end, label: 'Last month' }
    }
    case 'this_quarter': return { key: 'this_quarter', start: startOfQuarter(now), end: endOfDay(now), label: 'This quarter' }
    case 'this_year': return { key: 'this_year', start: startOfYear(now), end: endOfDay(now), label: 'This year' }
    case 'custom': {
      const parsedFrom = from ? new Date(`${from}T00:00:00`) : null
      const parsedTo = to ? new Date(`${to}T23:59:59.999`) : null
      if (parsedFrom && parsedTo && !Number.isNaN(parsedFrom.getTime()) && !Number.isNaN(parsedTo.getTime()) && parsedFrom <= parsedTo) {
        return { key: 'custom', start: parsedFrom, end: parsedTo, label: `${from} to ${to}` }
      }
      return { key: '30d', start: addDays(today, -29), end: endOfDay(now), label: 'Last 30 days' }
    }
    case 'this_month':
    default: return { key: 'this_month', start: startOfMonth(now), end: endOfDay(now), label: 'This month' }
  }
}

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 1000) / 10 : null }
function formatMonth(d: Date) { return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) }
function daysBetween(start: Date, end: Date) { return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000)) }
function addPeriod(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate() + days); return x }

async function paged<T>(queryFactory: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>, pageSize = 1000): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryFactory(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

export async function requireAnalyticsAccess() {
  const staff = await requireStaff()
  if (staff.role === 'super_admin' || staff.role === 'admissions_officer') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_admissions_stats') && hasPermission(staff, 'enquiries.view') && hasPermission(staff, 'applications.view') && hasPermission(staff, 'follow_ups.view')) return staff
  throw new ForbiddenError()
}

export interface AnalyticsData {
  range: { key: AnalyticsRangeKey; label: string; start: string; end: string }
  comparison: { label: string; leads: number | null; applications: number | null; enrolled: number | null; leadChange: number | null; applicationChange: number | null; enrolledChange: number | null }
  totals: { leads: number; newLeads: number; contacted: number; interested: number; applications: number; enrolled: number; conversion: number | null; leadToApplication: number | null; applicationToEnrollment: number | null }
  funnel: { label: string; count: number; previousPct: number | null; overallPct: number | null }[]
  sources: { source: string; leads: number; applications: number; enrolled: number; conversion: number | null }[]
  programmes: { programme: string; leads: number; interested: number; applications: number; enrolled: number; leadToApplication: number | null; applicationToEnrollment: number | null; leadToEnrollment: number | null }[]
  demand: { programme: string; count: number }[]
  statuses: { status: string; count: number }[]
  followUps: { dueToday: number; completedToday: number; upcoming: number; overdue: number; withoutFollowUp: number; withoutRecentActivity: number; completionRate: number | null }
  staff: { staff: string; leads: number; contacted: number; applications: number; enrolled: number; followUpsCompleted: number; conversion: number | null }[]
  lostReasons: { reason: string; count: number }[]
  trends: { label: string; leads: number; applications: number; enrolled: number }[]
  interactive: { experience: string; starts: number; completions: number; completionRate: number | null; leads: number; applications: number; enrolled: number; leadConversionRate: number | null }[]
  sourceProgramme: { source: string; programme: string; leads: number }[]
}

async function loadPeriod(supabase: any, range: AnalyticsRange) {
  const start = range.start.toISOString(); const end = range.end.toISOString()
  const [leads, createdApps, enrolledApps, dueFollowups, completedFollowups, events, programmes, staff] = await Promise.all([
    paged<LeadRow>((from, to) => supabase.from('leads').select('id,source,status,created_at,assigned_to').gte('created_at', start).lte('created_at', end).range(from, to)),
    paged<ApplicationRow>((from, to) => supabase.from('applications').select('id,lead_id,programme_id,status,assigned_to,created_at,enrolled_at').gte('created_at', start).lte('created_at', end).range(from, to)),
    paged<ApplicationRow>((from, to) => supabase.from('applications').select('id,lead_id,programme_id,status,assigned_to,created_at,enrolled_at').gte('enrolled_at', start).lte('enrolled_at', end).range(from, to)),
    paged<FollowUpRow>((from, to) => supabase.from('follow_ups').select('id,lead_id,assigned_to,due_date,status,completed_at').gte('due_date', start).lte('due_date', end).range(from, to)),
    paged<FollowUpRow>((from, to) => supabase.from('follow_ups').select('id,lead_id,assigned_to,due_date,status,completed_at').gte('completed_at', start).lte('completed_at', end).range(from, to)),
    paged<EventRow>((from, to) => supabase.from('conversion_events').select('event_name,lead_id,created_at').gte('created_at', start).lte('created_at', end).range(from, to)),
    supabase.from('programmes').select('id,name').order('display_order').then((r: any) => { if (r.error) throw r.error; return r.data ?? [] }),
    supabase.from('staff').select('id,full_name').eq('is_active', true).order('full_name').then((r: any) => { if (r.error) throw r.error; return r.data ?? [] })
  ])
  const appMap = new Map<string, ApplicationRow>()
  for (const row of [...createdApps, ...enrolledApps]) appMap.set(row.id, row)
  const followUpMap = new Map<string, FollowUpRow>()
  for (const row of [...dueFollowups, ...completedFollowups]) followUpMap.set(row.id, row)
  return { leads, apps: [...appMap.values()], followups: [...followUpMap.values()], events, programmes: programmes as ProgrammeRow[], staff: staff as StaffRow[] }
}

async function loadLeadAux(supabase: any, range: AnalyticsRange, leadIds: string[]) {
  const start = range.start.toISOString(); const end = range.end.toISOString()
  const interests = await paged<any>((from, to) => supabase.from('lead_interests').select('lead_id,programme_id,created_at').gte('created_at', start).lte('created_at', end).range(from, to))
  const relevantIds = [...new Set([...leadIds, ...interests.map((x: any) => x.lead_id).filter(Boolean)])]
  const lost = relevantIds.length ? await paged<any>((from, to) => supabase.from('leads').select('id,lost_reason,status').in('id', relevantIds).eq('status', 'lost').range(from, to)) : []
  const interactions = leadIds.length ? await paged<any>((from, to) => supabase.from('interactions').select('lead_id').in('lead_id', leadIds).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).range(from, to)) : []
  const attributionLeads = relevantIds.length ? await paged<LeadRow>((from, to) => supabase.from('leads').select('id,source,status,created_at,assigned_to').in('id', relevantIds).range(from, to)) : []
  return { interests, lost, activityLeadIds: new Set(interactions.map((x: any) => x.lead_id)), attributionLeads }
}

export async function getAdmissionsAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const staff = await requireAnalyticsAccess()
  const supabase = await createClient()
  const raw = await loadPeriod(supabase, range)
  const scopedLeadIds = staff.role === 'admissions_officer' ? new Set(raw.leads.filter(l => l.assigned_to === staff.id).map(l => l.id)) : null
  const current = { ...raw, leads: scopedLeadIds ? raw.leads.filter(l => scopedLeadIds.has(l.id)), apps: scopedLeadIds ? raw.apps.filter(a => scopedLeadIds.has(a.lead_id) || a.assigned_to === staff.id) : raw.apps, followups: scopedLeadIds ? raw.followups.filter(f => scopedLeadIds.has(f.lead_id) || f.assigned_to === staff.id) : raw.followups }
  const leadIds = current.leads.map(x => x.id)
  const aux = await loadLeadAux(supabase, range, leadIds)
  const programmeMap = new Map(current.programmes.map(p => [p.id, p.name]))
  const leadsById = new Map([...aux.attributionLeads, ...current.leads].map(l => [l.id, l]))
  const appsInRange = current.apps.filter(a => new Date(a.created_at) >= range.start && new Date(a.created_at) <= range.end)
  const enrolledInRange = current.apps.filter(a => a.enrolled_at && new Date(a.enrolled_at) >= range.start && new Date(a.enrolled_at) <= range.end)
  const appByLead = new Map<string, ApplicationRow[]>()
  for (const a of appsInRange) { const list = appByLead.get(a.lead_id) ?? []; list.push(a); appByLead.set(a.lead_id, list) }
  const enrolledByLead = new Set(enrolledInRange.map(a => a.lead_id))

  const sourceRows = new Map<string, { leads: number; applications: number; enrolled: number }>()
  for (const l of current.leads) { const r = sourceRows.get(l.source) ?? { leads: 0, applications: 0, enrolled: 0 }; r.leads++; sourceRows.set(l.source, r) }
  for (const a of appsInRange) { const source = leadsById.get(a.lead_id)?.source; if (!source) continue; const r = sourceRows.get(source) ?? { leads: 0, applications: 0, enrolled: 0 }; r.applications++; sourceRows.set(source, r) }
  for (const a of enrolledInRange) { const source = leadsById.get(a.lead_id)?.source; if (!source) continue; const r = sourceRows.get(source) ?? { leads: 0, applications: 0, enrolled: 0 }; r.enrolled++; sourceRows.set(source, r) }
  const sources = [...sourceRows.entries()].map(([source, r]) => ({ source: LEAD_SOURCE_LABELS[source as LeadSource] ?? source, ...r, conversion: pct(r.enrolled, r.leads) })).sort((a,b) => b.leads-a.leads)

  const demandMap = new Map<string, number>(); const programmeMapLeads = new Map<string, Set<string>>(); const programmeMapInterested = new Map<string, Set<string>>()
  for (const i of aux.interests) if (i.programme_id && programmeMap.has(i.programme_id)) { const s = programmeMapLeads.get(i.programme_id) ?? new Set<string>(); s.add(i.lead_id); programmeMapLeads.set(i.programme_id, s); if (leadsById.get(i.lead_id)?.status === 'interested') { const is = programmeMapInterested.get(i.programme_id) ?? new Set<string>(); is.add(i.lead_id); programmeMapInterested.set(i.programme_id, is) } }
  for (const [id, set] of programmeMapLeads) demandMap.set(id, set.size)
  const programmes = current.programmes.map(p => {
    const leads = programmeMapLeads.get(p.id)?.size ?? 0; const interested = programmeMapInterested.get(p.id)?.size ?? 0
    const apps = appsInRange.filter(a => a.programme_id === p.id).length; const enrolled = enrolledInRange.filter(a => a.programme_id === p.id).length
    return { programme: p.name, leads, interested, applications: apps, enrolled, leadToApplication: pct(apps, leads), applicationToEnrollment: pct(enrolled, apps), leadToEnrollment: pct(enrolled, leads) }
  }).sort((a,b) => b.leads-a.leads || a.programme.localeCompare(b.programme))

  const statuses = [...new Set(current.leads.map(l => l.status))].map(status => ({ status: LEAD_STATUS_LABELS[status] ?? status, count: current.leads.filter(l => l.status === status).length })).sort((a,b)=>b.count-a.count)
  const total = current.leads.length; const applications = appsInRange.length; const enrolled = enrolledInRange.length
  const funnelBase = [
    { label: 'Leads', count: total },
    { label: 'Contacted', count: current.leads.filter(l => ['contacted','interested','follow_up_later','application_started','application_submitted','admission_offered','enrolled'].includes(l.status)).length },
    { label: 'Interested', count: current.leads.filter(l => ['interested','follow_up_later','application_started','application_submitted','admission_offered','enrolled'].includes(l.status)).length },
    { label: 'Applications', count: applications },
    { label: 'Enrolled', count: enrolled }
  ]
  const funnel = funnelBase.map((s,i) => ({ ...s, previousPct: i === 0 ? null : pct(s.count, funnelBase[i-1].count), overallPct: pct(s.count, total) }))

  const now = new Date(); const todayStart = startOfDay(now); const tomorrow = addDays(todayStart, 1)
  const followUps = current.followups
  const dueToday = followUps.filter(f => f.status === 'pending' && new Date(f.due_date) >= todayStart && new Date(f.due_date) < tomorrow).length
  const completedToday = followUps.filter(f => f.status === 'completed' && f.completed_at && new Date(f.completed_at) >= todayStart && new Date(f.completed_at) < tomorrow).length
  const upcoming = followUps.filter(f => f.status === 'pending' && new Date(f.due_date) >= tomorrow).length
  const overdue = followUps.filter(f => f.status === 'pending' && new Date(f.due_date) < todayStart).length
  const dueInRange = followUps.filter(f => new Date(f.due_date) >= range.start && new Date(f.due_date) <= range.end)
  const completedInRange = followUps.filter(f => f.status === 'completed' && f.completed_at && new Date(f.completed_at) >= range.start && new Date(f.completed_at) <= range.end)
  const leadsWithFollowUp = new Set(followUps.map(f => f.lead_id))
  const withoutFollowUp = current.leads.filter(l => !leadsWithFollowUp.has(l.id)).length
  const withoutRecentActivity = current.leads.filter(l => !aux.activityLeadIds.has(l.id)).length

  const staffRows = current.staff.map(s => {
    const assignedLeads = current.leads.filter(l => l.assigned_to === s.id); const contacted = assignedLeads.filter(l => ['contacted','interested','follow_up_later','application_started','application_submitted','admission_offered','enrolled'].includes(l.status)).length
    const staffApps = appsInRange.filter(a => a.assigned_to === s.id || leadsById.get(a.lead_id)?.assigned_to === s.id).length
    const staffEnrolled = enrolledInRange.filter(a => a.assigned_to === s.id || leadsById.get(a.lead_id)?.assigned_to === s.id).length
    const completed = followUps.filter(f => f.assigned_to === s.id && f.status === 'completed' && f.completed_at && new Date(f.completed_at) >= range.start && new Date(f.completed_at) <= range.end).length
    return { staff: s.full_name, leads: assignedLeads.length, contacted, applications: staffApps, enrolled: staffEnrolled, followUpsCompleted: completed, conversion: pct(staffEnrolled, assignedLeads.length) }
  }).filter(s => s.leads || s.applications || s.enrolled || s.followUpsCompleted)

  const lostReasons = new Map<string, number>(); for (const l of aux.lost) if (l.lost_reason) lostReasons.set(l.lost_reason, (lostReasons.get(l.lost_reason) ?? 0) + 1)
  const trends: { label: string; leads: number; applications: number; enrolled: number }[] = []
  const span = daysBetween(range.start, range.end); const bucketDays = span <= 45 ? 7 : 30; let cursor = new Date(range.start)
  while (cursor <= range.end) { const bucketStart = new Date(cursor); const bucketEnd = new Date(Math.min(addPeriod(bucketStart, bucketDays).getTime() - 1, range.end.getTime())); trends.push({ label: bucketDays === 7 ? `${bucketStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : formatMonth(bucketStart), leads: current.leads.filter(l=>new Date(l.created_at)>=bucketStart && new Date(l.created_at)<=bucketEnd).length, applications: appsInRange.filter(a=>new Date(a.created_at)>=bucketStart && new Date(a.created_at)<=bucketEnd).length, enrolled: enrolledInRange.filter(a=>a.enrolled_at && new Date(a.enrolled_at)>=bucketStart && new Date(a.enrolled_at)<=bucketEnd).length }); cursor = addPeriod(bucketStart, bucketDays) }

  const eventGroups = [
    ['Career Quiz','career_quiz_started','career_quiz_completed','career_quiz'],
    ['Tech IQ Challenge','tech_challenge_started','tech_challenge_completed','tech_challenge']
  ] as const
  const interactive = eventGroups.map(([experience,startEvent,completeEvent,source]) => {
    const starts = current.events.filter(e=>e.event_name===startEvent).length; const completions = current.events.filter(e=>e.event_name===completeEvent).length
    const sourceLeads = current.leads.filter(l=>l.source===source).length; const sourceApps = appsInRange.filter(a=>leadsById.get(a.lead_id)?.source===source).length; const sourceEnrolled = enrolledInRange.filter(a=>leadsById.get(a.lead_id)?.source===source).length
    return { experience, starts, completions, completionRate: pct(completions,starts), leads: sourceLeads, applications: sourceApps, enrolled: sourceEnrolled, leadConversionRate: pct(sourceLeads, starts) }
  })

  const sourceProgrammeMap = new Map<string, number>()
  for (const i of aux.interests) { const lead = leadsById.get(i.lead_id); if (!lead || !i.programme_id) continue; const key = `${lead.source}|${i.programme_id}`; sourceProgrammeMap.set(key, (sourceProgrammeMap.get(key) ?? 0) + 1) }
  const sourceProgramme = [...sourceProgrammeMap.entries()].map(([key, leads]) => { const [source, programmeId] = key.split('|'); return { source: LEAD_SOURCE_LABELS[source as LeadSource] ?? source, programme: programmeMap.get(programmeId) ?? 'Unspecified', leads } }).sort((a,b)=>b.leads-a.leads)

  const comparisonDays = daysBetween(range.start, range.end); const comparisonEnd = new Date(range.start.getTime()-1); const comparisonStart = addPeriod(comparisonEnd, -comparisonDays+1)
  const comparisonRange: AnalyticsRange = { key: 'custom', start: comparisonStart, end: comparisonEnd, label: 'Previous period' }
  const prev = await loadPeriod(supabase, comparisonRange)
  const prevApps = prev.apps.filter(a => new Date(a.created_at)>=comparisonStart && new Date(a.created_at)<=comparisonEnd).length
  const prevEnrolled = prev.apps.filter(a => a.enrolled_at && new Date(a.enrolled_at)>=comparisonStart && new Date(a.enrolled_at)<=comparisonEnd).length
  const leadChange = pct(total - prev.leads.length, prev.leads.length); const applicationChange = pct(applications - prevApps, prevApps); const enrolledChange = pct(enrolled - prevEnrolled, prevEnrolled)

  return {
    range: { key: range.key, label: range.label, start: range.start.toISOString(), end: range.end.toISOString() },
    comparison: { label: 'Previous period', leads: prev.leads.length, applications: prevApps, enrolled: prevEnrolled, leadChange, applicationChange, enrolledChange },
    totals: { leads: total, newLeads: current.leads.filter(l=>l.status==='new').length, contacted: current.leads.filter(l=>l.status==='contacted').length, interested: current.leads.filter(l=>l.status==='interested').length, applications, enrolled, conversion: pct(enrolled,total), leadToApplication: pct(applications,total), applicationToEnrollment: pct(enrolled,applications) },
    funnel,
    sources,
    programmes,
    demand: programmes.filter(p=>p.leads>0).slice(0,10).map(p=>({programme:p.programme,count:p.leads})),
    statuses,
    followUps: { dueToday, completedToday, upcoming, overdue, withoutFollowUp, withoutRecentActivity, completionRate: pct(completedInRange.length,dueInRange.length) },
    staff: staffRows,
    lostReasons: [...lostReasons.entries()].map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count),
    trends,
    interactive,
    sourceProgramme
  }
}
