import 'server-only'
import { createAdminClient } from './supabase/admin'
import { requireStaff, ForbiddenError } from './auth'
import { hasPermission } from './permissions'
import type { Campaign, CampaignStatus, CampaignType, CampaignConversionGoal } from '../types/db'

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft', scheduled: 'Scheduled', active: 'Active', paused: 'Paused', completed: 'Completed', archived: 'Archived'
}
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  google_search: 'Google Search', meta_facebook: 'Meta / Facebook', instagram: 'Instagram', whatsapp: 'WhatsApp', organic_search: 'Organic Search',
  email: 'Email', referral: 'Referral', offline: 'Offline', event: 'Event', school_outreach: 'School outreach', programme_specific: 'Programme-specific',
  general_admissions: 'General admissions', seasonal: 'Seasonal', custom: 'Custom'
}
export const CAMPAIGN_GOAL_LABELS: Record<CampaignConversionGoal, string> = {
  enquiry: 'Enquiry', advisor_request: 'Advisor request', application: 'Application', enrollment: 'Enrollment'
}

export async function requireCampaignAccess(action: 'view'|'create'|'edit'|'delete' = 'view') {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (staff.role === 'content_manager' && hasPermission(staff, `campaigns.${action}`)) return staff
  throw new ForbiddenError()
}

export async function getCampaigns() {
  await requireCampaignAccess('view')
  const admin = createAdminClient()
  const { data, error } = await admin.from('campaigns').select('*, programmes:programme_id(id,name)').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Array<Campaign & { programmes: { id: string; name: string } | null }>
}

export async function getCampaignBySlug(slug: string, publicOnly = true): Promise<Campaign | null> {
  const admin = createAdminClient()
  let q = admin.from('campaigns').select('*').eq('slug', slug)
  if (publicOnly) q = q.eq('status', 'active')
  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  if (publicOnly) {
    const today = new Date().toISOString().slice(0, 10)
    if ((data.start_date && data.start_date > today) || (data.end_date && data.end_date < today)) return null
  }
  return data as Campaign
}

export async function getCampaignDetail(id: string) {
  await requireCampaignAccess('view')
  const admin = createAdminClient()
  const [{ data: campaign, error: campaignError }, { data: leads, error: leadsError }] = await Promise.all([
    admin.from('campaigns').select('*, programmes:programme_id(id,name)').eq('id', id).maybeSingle(),
    admin.from('leads').select('id,lead_reference,first_name,last_name,email,phone,status,source,utm_campaign,first_touch_source,first_touch_medium,last_touch_source,last_touch_medium,conversion_point,created_at').or(`first_touch_campaign_id.eq.${id},last_touch_campaign_id.eq.${id}`).order('created_at', { ascending: false }).limit(200)
  ])
  if (campaignError) throw campaignError
  if (leadsError) throw leadsError
  if (!campaign) return null
  const leadRows = leads ?? []
  const leadIds = leadRows.map((x: any) => x.id)
  const [{ data: apps }, { data: interests }] = await Promise.all([
    leadIds.length ? admin.from('applications').select('id,lead_id,status,enrolled_at,created_at').in('lead_id', leadIds) : Promise.resolve({ data: [] as any[] }),
    leadIds.length ? admin.from('lead_interests').select('lead_id,programme_id').in('lead_id', leadIds) : Promise.resolve({ data: [] as any[] })
  ])
  const applications = apps ?? []
  const enrolled = applications.filter((a: any) => a.status === 'enrolled').length
  return {
    campaign: campaign as Campaign & { programmes: { id: string; name: string } | null },
    leads: leadRows,
    metrics: {
      leads: leadRows.length,
      applications: applications.length,
      enrolled,
      leadToApplication: leadRows.length ? Math.round(applications.length / leadRows.length * 1000) / 10 : null,
      leadToEnrollment: leadRows.length ? Math.round(enrolled / leadRows.length * 1000) / 10 : null,
      applicationToEnrollment: applications.length ? Math.round(enrolled / applications.length * 1000) / 10 : null
    },
    applications,
    interests: interests ?? []
  }
}

export async function getCampaignPerformance(filters: { start?: string; end?: string; campaign?: string; source?: string; medium?: string; programme?: string; status?: string } = {}) {
  await requireCampaignAccess('view')
  const admin = createAdminClient()
  const start = filters.start ? `${filters.start}T00:00:00` : null
  const end = filters.end ? `${filters.end}T23:59:59.999` : null
  let campaignQuery = admin.from('campaigns').select('*, programmes:programme_id(id,name)').order('created_at', { ascending: false })
  if (filters.campaign) campaignQuery = campaignQuery.eq('id', filters.campaign)
  if (filters.status) campaignQuery = campaignQuery.eq('status', filters.status)
  const { data: campaigns, error: cErr } = await campaignQuery
  if (cErr) throw cErr
  let leadQuery = admin.from('leads').select('id,status,source,utm_source,utm_medium,utm_campaign,first_touch_campaign_id,last_touch_campaign_id,created_at')
  if (start) leadQuery = leadQuery.gte('created_at', start)
  if (end) leadQuery = leadQuery.lte('created_at', end)
  if (filters.source) leadQuery = leadQuery.or(`source.eq.${filters.source},utm_source.eq.${filters.source},first_touch_source.eq.${filters.source},last_touch_source.eq.${filters.source}`)
  if (filters.medium) leadQuery = leadQuery.or(`utm_medium.eq.${filters.medium},first_touch_medium.eq.${filters.medium},last_touch_medium.eq.${filters.medium}`)
  const { data: leads, error: lErr } = await leadQuery.limit(10000)
  if (lErr) throw lErr
  const rows = leads ?? []
  const leadIds = rows.map((l: any) => l.id)
  const { data: apps, error: aErr } = leadIds.length ? await admin.from('applications').select('lead_id,status,enrolled_at,created_at,programme_id').in('lead_id', leadIds) : { data: [], error: null }
  if (aErr) throw aErr
  const applications = apps ?? []
  const programmeMap = new Map<string, { name: string }>()
  for (const c of campaigns ?? []) if (c.programmes) programmeMap.set(c.programme_id, c.programmes)
  return (campaigns ?? []).map((c: any) => {
    const campaignLeads = rows.filter((l: any) => l.first_touch_campaign_id === c.id || l.last_touch_campaign_id === c.id)
    const ids = new Set(campaignLeads.map((l: any) => l.id))
    const campaignApps = applications.filter((a: any) => ids.has(a.lead_id))
    const enrolled = campaignApps.filter((a: any) => a.status === 'enrolled').length
    const source = c.source || c.medium || 'Unknown'
    return {
      ...c,
      programmeName: c.programmes?.name ?? 'All programmes',
      source,
      leads: campaignLeads.length,
      applications: campaignApps.length,
      enrolled,
      conversion: campaignLeads.length ? Math.round(enrolled / campaignLeads.length * 1000) / 10 : null,
      leadToApplication: campaignLeads.length ? Math.round(campaignApps.length / campaignLeads.length * 1000) / 10 : null,
      leadToEnrollment: campaignLeads.length ? Math.round(enrolled / campaignLeads.length * 1000) / 10 : null
    }
  }).filter((x: any) => !filters.programme || x.programme_id === filters.programme)
}

export async function getSourcePerformance(filters: { start?: string; end?: string } = {}) {
  await requireCampaignAccess('view')
  const admin = createAdminClient()
  let q = admin.from('leads').select('id,status,source,utm_source,created_at')
  if (filters.start) q = q.gte('created_at', `${filters.start}T00:00:00`)
  if (filters.end) q = q.lte('created_at', `${filters.end}T23:59:59.999`)
  const { data: leads, error } = await q.limit(10000)
  if (error) throw error
  const rows = leads ?? []
  const ids = rows.map((x: any) => x.id)
  const { data: apps } = ids.length ? await admin.from('applications').select('lead_id,status').in('lead_id', ids) : { data: [] as any[] }
  const appRows = apps ?? []
  const groups = new Map<string, any>()
  for (const lead of rows) {
    const key = lead.utm_source || lead.source || 'unknown'
    const item = groups.get(key) ?? { source: key, leads: 0, applications: 0, enrolled: 0 }
    item.leads++
    groups.set(key, item)
  }
  for (const app of appRows) {
    const lead = rows.find((x: any) => x.id === app.lead_id)
    if (!lead) continue
    const key = lead.utm_source || lead.source || 'unknown'
    const item = groups.get(key)
    if (!item) continue
    item.applications++
    if (app.status === 'enrolled') item.enrolled++
  }
  return [...groups.values()].map(x => ({ ...x, conversion: x.leads ? Math.round(x.enrolled / x.leads * 1000) / 10 : null })).sort((a,b) => b.leads - a.leads)
}
