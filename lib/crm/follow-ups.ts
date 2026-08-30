import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { FollowUpStatus } from '../../types/db'

export interface FollowUpsFilter {
  status?: FollowUpStatus | ''
  assignedTo?: string
  page?: number
  pageSize?: number
}

export async function getFollowUps(filter: FollowUpsFilter) {
  await requireStaff()
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
