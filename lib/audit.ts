import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAudit(
  admin: SupabaseClient,
  entry: {
    userId?: string | null
    action: string
    entity: string
    entityId?: string | null
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await admin.from('audit_logs').insert({
    user_id: entry.userId ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? null
  })

  // Audit logging should never break the primary action. Log server-side
  // and move on if it fails.
  if (error) {
    console.error('[audit] failed to write audit log', error)
  }
}
