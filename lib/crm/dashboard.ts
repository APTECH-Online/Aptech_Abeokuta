import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, PIPELINE_STAGES, type LeadStatus } from '../../types/db'

export interface DashboardData {
  totalLeads: number
  newLeads: number
  contacted: number
  interested: number
  applicationsCount: number
  enrolledCount: number
  followUpsDueCount: number
  pipeline: { status: LeadStatus; label: string; count: number }[]
  leadsByMonth: { month: string; count: number }[]
  leadsByProgramme: { programme: string; count: number }[]
  leadsBySource: { source: string; count: number }[]
  leadsByStatus: { status: string; count: number }[]
  applicationsByProgramme: { programme: string; count: number }[]
  conversionRate: number
  overdueFollowUps: { id: string; leadName: string; leadId: string; dueDate: string }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  await requireStaff()
  const supabase = await createClient()

  const [
    { count: totalLeads },
    { count: newLeads },
    { count: contacted },
    { count: interested },
    { count: applicationsCount },
    { count: enrolledCount },
    { data: leadsRaw },
    { data: applicationsRaw },
    { data: overdueRaw }
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'interested'),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'enrolled'),
    supabase
      .from('leads')
      .select('id, status, source, created_at, lead_interests(programme_id, programmes(name))')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase.from('applications').select('id, programme_id, programmes(name)').limit(2000),
    supabase
      .from('follow_ups')
      .select('id, due_date, lead_id, leads(first_name, last_name)')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(20)
  ])

  const leads = leadsRaw ?? []
  const applications = applicationsRaw ?? []

  // Pipeline
  const pipeline = PIPELINE_STAGES.map((status) => ({
    status,
    label: LEAD_STATUS_LABELS[status],
    count: leads.filter((l: any) => l.status === status).length
  }))

  // Leads by status (all statuses, for a full breakdown chart)
  const statusCounts = new Map<string, number>()
  for (const l of leads as any[]) {
    statusCounts.set(l.status, (statusCounts.get(l.status) ?? 0) + 1)
  }
  const leadsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status: LEAD_STATUS_LABELS[status as LeadStatus] ?? status,
    count
  }))

  // Leads by source
  const sourceCounts = new Map<string, number>()
  for (const l of leads as any[]) {
    sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1)
  }
  const leadsBySource = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source: LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS] ?? source, count }))
    .sort((a, b) => b.count - a.count)

  // Leads by programme (via lead_interests join)
  const programmeCounts = new Map<string, number>()
  for (const l of leads as any[]) {
    const interests = l.lead_interests ?? []
    const names = new Set<string>(interests.map((i: any) => i.programmes?.name).filter(Boolean))
    for (const name of names) {
      programmeCounts.set(name, (programmeCounts.get(name) ?? 0) + 1)
    }
  }
  const leadsByProgramme = Array.from(programmeCounts.entries())
    .map(([programme, count]) => ({ programme, count }))
    .sort((a, b) => b.count - a.count)

  // Applications by programme
  const appProgrammeCounts = new Map<string, number>()
  for (const a of applications as any[]) {
    const name = a.programmes?.name ?? 'Unassigned'
    appProgrammeCounts.set(name, (appProgrammeCounts.get(name) ?? 0) + 1)
  }
  const applicationsByProgramme = Array.from(appProgrammeCounts.entries()).map(([programme, count]) => ({
    programme,
    count
  }))

  // Leads by month (last 6 months)
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) })
  }
  const monthCounts = new Map(months.map((m) => [m.key, 0]))
  for (const l of leads as any[]) {
    const d = new Date(l.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthCounts.has(key)) monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1)
  }
  const leadsByMonth = months.map((m) => ({ month: m.label, count: monthCounts.get(m.key) ?? 0 }))

  const overdueFollowUps = (overdueRaw ?? []).map((f: any) => ({
    id: f.id,
    leadId: f.lead_id,
    leadName: f.leads ? `${f.leads.first_name} ${f.leads.last_name}` : 'Unknown lead',
    dueDate: f.due_date
  }))

  const conversionRate = totalLeads && totalLeads > 0 ? Math.round(((enrolledCount ?? 0) / totalLeads) * 1000) / 10 : 0

  return {
    totalLeads: totalLeads ?? 0,
    newLeads: newLeads ?? 0,
    contacted: contacted ?? 0,
    interested: interested ?? 0,
    applicationsCount: applicationsCount ?? 0,
    enrolledCount: enrolledCount ?? 0,
    followUpsDueCount: overdueFollowUps.length,
    pipeline,
    leadsByMonth,
    leadsByProgramme,
    leadsBySource,
    leadsByStatus,
    applicationsByProgramme,
    conversionRate,
    overdueFollowUps
  }
}
