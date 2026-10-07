import 'server-only'
import { createClient } from '../supabase/server'
import { requireCrmAction } from '../auth'
import type { FollowUpStatus } from '../../types/db'

export interface FollowUpsFilter {
  status?: FollowUpStatus | ''
  assignedTo?: string
  page?: number
  pageSize?: number
}

export async function getFollowUps(filter: FollowUpsFilter) {
  await requireCrmAction('follow_ups', 'view')
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('follow_ups')
    .select(
      'id, due_date, type, status, notes, completed_at, lead_id, leads(id, first_name, last_name, lead_reference), staff:assigned_to(full_name)',
      { count: 'exact' }
    )
    .order('due_date', { ascending: true })

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.assignedTo) query = query.eq('assigned_to', filter.assignedTo)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load follow-ups', error)
    return { followUps: [], total: 0, page, pageSize }
  }

  const now = Date.now()
  const rows = (data ?? []).map((f: any) => ({
    ...f,
    isOverdue: f.status === 'pending' && new Date(f.due_date).getTime() < now
  }))

  return { followUps: rows, total: count ?? 0, page, pageSize }
}


export async function getFollowUpDashboard() {
  await requireCrmAction('follow_ups', 'view')
  const supabase = await createClient()
  const now = new Date()
  const start = new Date(now); start.setHours(0,0,0,0)
  const end = new Date(start); end.setDate(end.getDate()+1)
  const upcomingEnd = new Date(start); upcomingEnd.setDate(upcomingEnd.getDate()+8)

  const [{ data: overdue }, { data: today }, { data: upcoming }, { count: uncontacted }] = await Promise.all([
    supabase.from('follow_ups').select('id, due_date, lead_id, type, notes, leads(first_name,last_name,lead_reference)').eq('status','pending').lt('due_date', start.toISOString()).order('due_date').limit(20),
    supabase.from('follow_ups').select('id, due_date, lead_id, type, notes, leads(first_name,last_name,lead_reference)').eq('status','pending').gte('due_date', start.toISOString()).lt('due_date', end.toISOString()).order('due_date').limit(20),
    supabase.from('follow_ups').select('id, due_date, lead_id, type, notes, leads(first_name,last_name,lead_reference)').eq('status','pending').gte('due_date', end.toISOString()).lt('due_date', upcomingEnd.toISOString()).order('due_date').limit(30),
    supabase.from('leads').select('id',{count:'exact',head:true}).eq('status','new')
  ])
  return { overdue: overdue ?? [], today: today ?? [], upcoming: upcoming ?? [], uncontacted: uncontacted ?? 0 }
}
