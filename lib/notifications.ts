import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Notification, NotificationType, Staff, StaffRole } from '../types/db'

export interface CreateNotificationInput {
  type: NotificationType
  title: string
  body?: string | null
  link?: string | null
  entity?: string | null
  entityId?: string | null
  /** Send to exactly one staff member — takes precedence over targetRoles. */
  recipientId?: string | null
  /** Broadcast to every active staff member holding one of these roles. */
  targetRoles?: StaffRole[] | null
}

/**
 * Writes a CRM notification. This is the in-app replacement for what would
 * otherwise be a "send an email to staff" step — see lib/email/send.ts for
 * why: no email provider is configured, so alerts live here instead, surfaced
 * on /admin/notifications and the sidebar unread badge.
 *
 * Call sites should treat this as best-effort (wrap in Promise.allSettled
 * alongside other side effects) — a failed notification insert should never
 * block the primary action (submitting a lead, creating an application, etc).
 */
export async function createNotification(admin: SupabaseClient, input: CreateNotificationInput): Promise<void> {
  const { error } = await admin.from('notifications').insert({
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    entity: input.entity ?? null,
    entity_id: input.entityId ?? null,
    recipient_id: input.recipientId ?? null,
    target_roles: input.recipientId ? null : (input.targetRoles ?? null)
  })

  if (error) {
    console.error('[notifications] failed to create notification', error)
  }
}

/**
 * Fetches notifications visible to `staff` (RLS already scopes this to
 * broadcasts + their own role + direct mentions), merged with their own
 * read state. Supabase-js can't express "left join a per-user read table"
 * in one call, so this does two queries and merges them in memory — fine
 * at CRM scale (dozens of notifications, not millions).
 */
export async function getNotificationsForStaff(
  supabase: SupabaseClient,
  staff: Staff,
  limit = 50
): Promise<Notification[]> {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !notifications) {
    console.error('[notifications] failed to load notifications', error)
    return []
  }

  const { data: reads } = await supabase
    .from('notification_reads')
    .select('notification_id, read_at')
    .eq('staff_id', staff.id)

  const readMap = new Map((reads ?? []).map((r) => [r.notification_id, r.read_at]))

  return (notifications as Notification[]).map((n) => ({ ...n, read_at: readMap.get(n.id) ?? null }))
}

/** Count of notifications visible to `staff` with no read receipt yet. */
export async function getUnreadNotificationCount(supabase: SupabaseClient, staff: Staff): Promise<number> {
  const notifications = await getNotificationsForStaff(supabase, staff, 200)
  return notifications.filter((n) => !n.read_at).length
}
