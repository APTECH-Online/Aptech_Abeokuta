import 'server-only'
import { createClient } from '../supabase/server'
import { requireCrmAction } from '../auth'
import type { LeadPriority, LeadStatus, LeadSource } from '../../types/db'

export interface LeadsFilter {
  search?: string
  status?: LeadStatus | ''
  programmeId?: string
  source?: LeadSource | ''
  priority?: LeadPriority | ''
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface LeadRow {
  id: string
  lead_reference: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: LeadStatus
  priority: LeadPriority
  source: LeadSource
  created_at: string
  updated_at: string
  assigned_to: string | null
  assignedName: string | null
  programmeName: string | null
}

export async function getLeads(filter: LeadsFilter) {
  await requireCrmAction('enquiries', 'view')
  const supabase = await createClient()
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('leads')
    .select(
      filter.programmeId
        ? 'id, lead_reference, first_name, last_name, email, phone, status, priority, source, created_at, updated_at, assigned_to, staff:assigned_to(full_name), lead_interests!inner(programme_id, created_at, programmes(name))'
        : 'id, lead_reference, first_name, last_name, email, phone, status, priority, source, created_at, updated_at, assigned_to, staff:assigned_to(full_name), lead_interests(programme_id, created_at, programmes(name))',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (filter.search) {
    const s = filter.search.replace(/[%_]/g, '')
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,lead_reference.ilike.%${s}%`
    )
    // When the search term itself matches programme names, constrain the same
    // query to those programme relationships so staff can search by programme
    // without loading the entire lead table into memory.
    if (!filter.programmeId) {
      const { data: matchingProgrammes } = await supabase.from('programmes').select('id').ilike('name', `%${s}%`).limit(20)
      const ids = (matchingProgrammes ?? []).map((p: any) => p.id)
      if (ids.length) {
        query = supabase.from('leads')
          .select('id, lead_reference, first_name, last_name, email, phone, status, priority, source, created_at, updated_at, assigned_to, staff:assigned_to(full_name), lead_interests!inner(programme_id, created_at, programmes(name))', { count: 'exact' })
          .in('lead_interests.programme_id', ids)
          .or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,lead_reference.ilike.%${s}%`)
          .order('created_at', { ascending: false })
      }
    }
  }
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.priority) query = query.eq('priority', filter.priority)
  if (filter.programmeId) query = query.eq('lead_interests.programme_id', filter.programmeId)
  if (filter.source) query = query.eq('source', filter.source)
  if (filter.assignedTo) query = query.eq('assigned_to', filter.assignedTo)
  if (filter.dateFrom) query = query.gte('created_at', filter.dateFrom)
  if (filter.dateTo) query = query.lte('created_at', `${filter.dateTo}T23:59:59`)

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[crm] failed to load leads', error)
    return { leads: [] as LeadRow[], total: 0, page, pageSize }
  }

  let rows = (data ?? []).map((l: any) => {
    const interests = (l.lead_interests ?? []).slice().sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const latest = interests[0]
    return {
      id: l.id,
      lead_reference: l.lead_reference,
      first_name: l.first_name,
      last_name: l.last_name,
      email: l.email,
      phone: l.phone,
      status: l.status,
      priority: l.priority,
      source: l.source,
      created_at: l.created_at,
      updated_at: l.updated_at,
      assigned_to: l.assigned_to,
      assignedName: l.staff?.full_name ?? null,
      programmeName: latest?.programmes?.name ?? null,
      programmeId: latest?.programme_id ?? null
    } as LeadRow & { programmeId: string | null }
  })



  return { leads: rows, total: count ?? 0, page, pageSize }
}

export async function getLeadFilterOptions() {
  await requireCrmAction('enquiries', 'view')
  const supabase = await createClient()
  const [{ data: staff }, { data: programmes }] = await Promise.all([
    supabase.from('staff').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('programmes').select('id, name').order('display_order')
  ])
  return { staff: staff ?? [], programmes: programmes ?? [] }
}
