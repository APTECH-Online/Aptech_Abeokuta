import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff, ForbiddenError } from '../auth'
import { hasPermission } from '../permissions'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, PIPELINE_STAGES, type LeadStatus, type Staff } from '../../types/db'

/**
 * Dashboard/reports access (spec section 4). Super Admin: unrestricted, as
 * always. Content Manager: only if explicitly granted `dashboard_access`
 * AND `dashboard_view_crm_stats` — these stats are Enquiries/Applications/
 * Follow-ups numbers, which a Content Manager doesn't see just by holding
 * the role. Within that, each individual stat group is further hidden
 * unless the caller can also view the underlying module (spec: "Do not
 * expose statistics for modules the Content Manager cannot access").
 */
export async function requireDashboardCrmAccess(): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_crm_stats')) {
    return staff
  }
  throw new ForbiddenError()
}

export interface DashboardData {
  totalLeads: number
  newLeads: number
  contacted: number
  interested: number
  applicationsCount: number
  enrolledCount: number
  followUpsDueCount: number
  followUpsTodayCount: number
  upcomingFollowUpsCount: number
  uncontactedCount: number
  pipeline: { status: LeadStatus; label: string; count: number }[]
  leadsByMonth: { month: string; count: number }[]
  leadsByProgramme: { programme: string; count: number }[]
  leadsBySource: { source: string; count: number }[]
  leadsByStatus: { status: string; count: number }[]
  applicationsByProgramme: { programme: string; count: number }[]
  conversionRate: number
  overdueFollowUps: { id: string; leadName: string; leadId: string; dueDate: string }[]
  recentWebsiteEnquiries: { id: string; leadId: string; leadName: string; email: string; subject: string; message: string; createdAt: string }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const staff = await requireDashboardCrmAccess()
  const isSuperAdmin = staff.role === 'super_admin'
  // Fine-grained: even with dashboard_view_crm_stats, a Content Manager only
  // sees numbers for the specific CRM module(s) they can also view.
  const showEnquiries = isSuperAdmin || hasPermission(staff, 'enquiries.view')
  const showApplications = isSuperAdmin || hasPermission(staff, 'applications.view')
  const showFollowUps = isSuperAdmin || hasPermission(staff, 'follow_ups.view')

  const supabase = await createClient()

  const zeroCount = Promise.resolve({ count: 0 })
  const emptyRows = Promise.resolve({ data: [] as any[], error: null })

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1)
  const upcomingEnd = new Date(dayStart); upcomingEnd.setDate(upcomingEnd.getDate() + 8)

  const [
    { count: totalLeads },
    { count: newLeads },
    { count: contacted },
    { count: interested },
    { count: applicationsCount },
    { count: enrolledCount },
    { count: followUpsDueCount },
    { count: followUpsTodayCount },
    { count: upcomingFollowUpsCount },
    { count: uncontactedCount },
    { data: leadsRaw },
    { data: overdueRaw },
    { data: websiteEnquiriesRaw },
    { data: programmesRaw, error: programmesError }
  ] = await Promise.all([
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }) : zeroCount,
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new') : zeroCount,
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'contacted') : zeroCount,
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'interested') : zeroCount,
    showApplications ? supabase.from('applications').select('id', { count: 'exact', head: true }) : zeroCount,
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'enrolled') : zeroCount,
    showFollowUps ? supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', dayStart.toISOString()) : zeroCount,
    showFollowUps ? supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('due_date', dayStart.toISOString()).lt('due_date', dayEnd.toISOString()) : zeroCount,
    showFollowUps ? supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('due_date', dayEnd.toISOString()).lt('due_date', upcomingEnd.toISOString()) : zeroCount,
    showEnquiries ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new') : zeroCount,
    showEnquiries ? supabase.from('leads').select('id, status, source, created_at, priority').order('created_at', { ascending: false }).limit(2000) : emptyRows,
    showFollowUps ? supabase.from('follow_ups').select('id, due_date, lead_id, leads(first_name, last_name)').eq('status', 'pending').lt('due_date', dayStart.toISOString()).order('due_date', { ascending: true }).limit(20) : emptyRows,
    showEnquiries ? supabase.from('interactions').select('id, lead_id, subject, description, created_at, leads(first_name, last_name, email)').eq('type', 'website').order('created_at', { ascending: false }).limit(8) : emptyRows,
    showEnquiries ? supabase.from('programmes').select('id, name').order('display_order', { ascending: true }) : emptyRows
  ])

  if (programmesError) {
    console.error('[crm] failed to load programmes for dashboard metrics', programmesError)
  }

  const leads = leadsRaw ?? []

  // The programme metrics intentionally do not derive from the 2,000-row lead
  // dashboard sample. That sample is useful for pipeline/month/source cards but
  // cannot produce a complete programme breakdown on a large CRM dataset.
  // Read the relationship table directly, page through every row, and count
  // each lead/programme pair once. This also prevents a lead with duplicate
  // interest records from inflating a programme's count.
  const programmeRows = (programmesRaw ?? []) as { id: string; name: string }[]
  const leadProgrammePairs = new Set<string>()
  if (showEnquiries) {
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('lead_interests')
        .select('lead_id, programme_id')
        .not('programme_id', 'is', null)
        .range(from, from + pageSize - 1)

      if (error) {
        console.error('[crm] failed to load lead programme relationships', error)
        break
      }

      for (const row of data ?? []) {
        if (row.lead_id && row.programme_id) {
          leadProgrammePairs.add(`${row.lead_id}:${row.programme_id}`)
        }
      }

      if (!data || data.length < pageSize) break
    }
  }

  const applicationProgrammeIds: string[] = []
  if (showApplications) {
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('applications')
        .select('programme_id')
        .range(from, from + pageSize - 1)

      if (error) {
        console.error('[crm] failed to load application programme relationships', error)
        break
      }

      for (const row of data ?? []) {
        if (row.programme_id) applicationProgrammeIds.push(row.programme_id)
      }

      if (!data || data.length < pageSize) break
    }
  }

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

  // Leads by programme. Start from the programme catalogue so programmes with
  // no leads are represented explicitly as zero.
  const leadCountByProgrammeId = new Map<string, number>()
  for (const pair of leadProgrammePairs) {
    const programmeId = pair.slice(pair.lastIndexOf(':') + 1)
    leadCountByProgrammeId.set(programmeId, (leadCountByProgrammeId.get(programmeId) ?? 0) + 1)
  }
  const leadsByProgramme = programmeRows
    .map((programme) => ({
      programme: programme.name,
      count: leadCountByProgrammeId.get(programme.id) ?? 0
    }))
    .sort((a, b) => b.count - a.count || a.programme.localeCompare(b.programme))

  // Applications by programme. Count application records directly by their
  // foreign key, rather than relying on a joined response that can be capped
  // or duplicated by relationships. Every catalogue programme is retained.
  const appProgrammeCounts = new Map<string, number>()
  for (const programmeId of applicationProgrammeIds) {
    appProgrammeCounts.set(programmeId, (appProgrammeCounts.get(programmeId) ?? 0) + 1)
  }
  const applicationsByProgramme = programmeRows
    .map((programme) => ({
      programme: programme.name,
      count: appProgrammeCounts.get(programme.id) ?? 0
    }))
    .sort((a, b) => b.count - a.count || a.programme.localeCompare(b.programme))

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

  const recentWebsiteEnquiries = (websiteEnquiriesRaw ?? []).map((i: any) => ({
    id: i.id,
    leadId: i.lead_id,
    leadName: i.leads ? `${i.leads.first_name} ${i.leads.last_name}` : 'Unknown lead',
    email: i.leads?.email ?? '',
    subject: i.subject ?? 'Website enquiry',
    message: i.description ?? '',
    createdAt: i.created_at
  }))

  const conversionRate = totalLeads && totalLeads > 0 ? Math.round(((enrolledCount ?? 0) / totalLeads) * 1000) / 10 : 0

  return {
    totalLeads: totalLeads ?? 0,
    newLeads: newLeads ?? 0,
    contacted: contacted ?? 0,
    interested: interested ?? 0,
    applicationsCount: applicationsCount ?? 0,
    enrolledCount: enrolledCount ?? 0,
    followUpsDueCount: followUpsDueCount ?? overdueFollowUps.length,
    followUpsTodayCount: followUpsTodayCount ?? 0,
    upcomingFollowUpsCount: upcomingFollowUpsCount ?? 0,
    uncontactedCount: uncontactedCount ?? 0,
    pipeline,
    leadsByMonth,
    leadsByProgramme,
    leadsBySource,
    leadsByStatus,
    applicationsByProgramme,
    conversionRate,
    overdueFollowUps,
    recentWebsiteEnquiries
  }
}
