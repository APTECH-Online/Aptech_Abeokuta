import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { ApplicationStatus } from '../../types/db'

export interface ApplicationsFilter {
  status?: ApplicationStatus | ''
  programmeId?: string
  page?: number
  pageSize?: number
}

export async function getApplications(filter: ApplicationsFilter) {
  await requireStaff()
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('applications')
    .select(
      'id, application_reference, status, submitted_at, reviewed_at, created_at, programme_id, leads(id, first_name, last_name, lead_reference), programmes(name), staff:assigned_to(full_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.programmeId) query = query.eq('programme_id', filter.programmeId)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load applications', error)
    return { applications: [], total: 0, page, pageSize }
  }

  return { applications: (data ?? []) as any[], total: count ?? 0, page, pageSize }
}
