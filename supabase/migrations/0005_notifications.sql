-- ============================================================================
-- APTECH Abeokuta — In-app CRM notifications
--
-- This project has no configured email provider (see lib/email/send.ts —
-- it just logs), so staff alerts that used to be "send an email" instead
-- become rows here, surfaced in the CRM's Notifications page and a sidebar
-- unread badge. A notification is either:
--   - targeted at one staff member (recipient_id set), e.g. "your follow-up
--     with Jane Doe is overdue", or
--   - broadcast to a set of roles (target_roles set, recipient_id null), e.g.
--     "a new enquiry came in" going to every admissions_officer+.
--   - broadcast to everyone (both recipient_id and target_roles null).
--
-- Read state is tracked per-staff in a join table rather than a boolean
-- column on notifications, since a broadcast notification is "unread" for
-- some staff and "read" for others simultaneously.
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text,
  link text,
  entity text,
  entity_id uuid,
  recipient_id uuid references staff (id) on delete cascade,
  target_roles staff_role[],
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on notifications (recipient_id);
create index idx_notifications_created_at on notifications (created_at desc);

create table notification_reads (
  notification_id uuid not null references notifications (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, staff_id)
);

create index idx_notification_reads_staff on notification_reads (staff_id);

alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- Staff can read a notification if it was broadcast to everyone, broadcast
-- to a role they hold, or addressed to them directly.
create policy "notifications_select_staff" on notifications
  for select using (
    is_active_staff()
    and (
      (recipient_id is null and target_roles is null)
      or recipient_id = auth.uid()
      or (
        target_roles is not null
        and exists (select 1 from staff where id = auth.uid() and role = any (target_roles))
      )
    )
  );

-- Staff can only see (and, via server actions, write) their own read receipts.
create policy "notification_reads_select_own" on notification_reads
  for select using (staff_id = auth.uid());

-- Writes to both tables happen via server actions using the service-role
-- client (see lib/notifications.ts), which bypasses RLS by design — the
-- same pattern used everywhere else in this schema.
