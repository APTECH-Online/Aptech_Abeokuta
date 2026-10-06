-- ============================================================================
-- APTECH Abeokuta — Role-aware notifications
-- Migration 0024
--
-- Migration 0014 narrowed notification reads to Super Admin only, which meant
-- notifications addressed to Admissions Officers (new enquiries, contact
-- messages, overdue follow-ups) were written but never visible to them.
--
-- This restores the original delivery model from 0005, on top of the RBAC
-- helpers from 0014. A staff member can read a notification when it is:
--   • a broadcast to everyone      (recipient_id and target_roles both null)
--   • addressed to them directly   (recipient_id = their id)
--   • sent to a role they hold     (recipient_id null, role in target_roles)
-- and read receipts stay private to the person who made them.
--
-- Writes are unchanged: they happen server-side with the service-role client.
-- ============================================================================

drop policy if exists "notifications_select_super_admin" on notifications;
drop policy if exists "notifications_select_staff" on notifications;
drop policy if exists "notifications_select_by_role" on notifications;
create policy "notifications_select_by_role" on notifications
  for select using (
    is_active_staff()
    and (
      (recipient_id is null and target_roles is null)
      or recipient_id = auth.uid()
      or (
        recipient_id is null
        and target_roles is not null
        and current_staff_role() = any (target_roles)
      )
    )
  );

drop policy if exists "notification_reads_select_super_admin" on notification_reads;
drop policy if exists "notification_reads_select_own" on notification_reads;
create policy "notification_reads_select_own" on notification_reads
  for select using (is_active_staff() and staff_id = auth.uid());
