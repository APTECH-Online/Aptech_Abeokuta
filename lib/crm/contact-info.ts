import 'server-only'
import { createClient } from '../supabase/server'
import { requireStaff } from '../auth'
import type { ContactInfo } from '../../types/db'

/** There is only ever meant to be one row; this returns the earliest one. */
export async function getContactInfo(): Promise<ContactInfo | null> {
  await requireStaff()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .order('updated_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as ContactInfo
}
