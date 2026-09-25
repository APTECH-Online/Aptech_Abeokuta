'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/admin'

export type ActionResult = { ok: boolean; message?: string }

/**
 * Marks a single notification as read for the current staff member.
 * Read receipts are per-staff (see notification_reads), so this never
 * touches the notification row itself — just inserts/upserts this staff
 * member's receipt.
 */
export async function markNotificationRead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const notificationId = String(formData.get('notificationId') || '')
    if (!notificationId) return { ok: false, message: 'Missing notification.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('notification_reads')
      .upsert({ notification_id: notificationId, staff_id: staff.id }, { onConflict: 'notification_id,staff_id' })

    if (error) {
      console.error('[notifications] failed to mark read', error)
      return { ok: false, message: 'Could not update this notification.' }
    }

    revalidatePath('/admin/notifications')
    revalidatePath('/admin', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, message: 'You must be signed in to do that.' }
  }
}

/** Marks every notification currently visible to this staff member as read. */
export async function markAllNotificationsRead(_prev: ActionResult, _formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireRole('super_admin')
    const admin = createAdminClient()

    const { data: notifications, error: fetchError } = await admin
      .from('notifications')
      .select('id, recipient_id, target_roles')
    if (fetchError) {
      console.error('[notifications] failed to load notifications for mark-all', fetchError)
      return { ok: false, message: 'Could not update notifications.' }
    }

    // The admin client bypasses RLS, so re-apply the same visibility rule
    // notifications_select_staff enforces (broadcast, own role, or direct)
    // — otherwise "mark all read" would create receipts for notifications
    // this staff member was never shown.
    const visible = (notifications ?? []).filter(
      (n) =>
        n.recipient_id === staff.id ||
        (n.recipient_id === null && (n.target_roles === null || n.target_roles.includes(staff.role)))
    )

    const rows = visible.map((n) => ({ notification_id: n.id, staff_id: staff.id }))
    if (rows.length > 0) {
      const { error } = await admin
        .from('notification_reads')
        .upsert(rows, { onConflict: 'notification_id,staff_id' })
      if (error) {
        console.error('[notifications] failed to mark all read', error)
        return { ok: false, message: 'Could not update notifications.' }
      }
    }

    revalidatePath('/admin/notifications')
    revalidatePath('/admin', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, message: 'You must be signed in to do that.' }
  }
}
