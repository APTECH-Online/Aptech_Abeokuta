import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'

export async function getLeadDetail(leadId: string) {
  await requireStaff()
  const supabase = await createClient()

  const [
    { data: lead },
    { data: education },
    { data: interests },
    { data: applications },
    { data: interactions },
    { data: followUps },
    { data: staff },
    { data: programmes }
  ] = await Promise.all([
    supabase.from('leads').select('*, staff:assigned_to(id, full_name)').eq('id', leadId).maybeSingle(),
    supabase.from('lead_education').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1),
    supabase
      .from('lead_interests')
      .select('*, programmes(id, name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
    supabase
      .from('applications')
      .select('*, programmes(name), staff:assigned_to(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
    supabase
      .from('interactions')
      .select('*, staff:user_id(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
    supabase
      .from('follow_ups')
      .select('*, staff:assigned_to(full_name)')
      .eq('lead_id', leadId)
      .order('due_date', { ascending: false }),
    supabase.from('staff').select('id, full_name, role').eq('is_active', true).order('full_name'),
    supabase.from('programmes').select('id, name, status').order('display_order')
  ])

  if (!lead) return null

  return {
    lead,
    education: education?.[0] ?? null,
    interests: interests ?? [],
    applications: applications ?? [],
    interactions: interactions ?? [],
    followUps: followUps ?? [],
    staffOptions: staff ?? [],
    programmeOptions: programmes ?? []
  }
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>
