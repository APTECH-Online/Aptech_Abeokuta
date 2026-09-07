-- ============================================================================
-- APTECH Abeokuta — Follow-up email reminders
--
-- Tracks whether a reminder email has already gone out for a follow-up, so
-- the reminder job (run on a schedule) doesn't email staff again every time
-- it runs for the same overdue/due follow-up.
-- ============================================================================

alter table public.follow_ups
  add column if not exists reminder_sent_at timestamptz;

create index if not exists idx_follow_ups_reminder_pending
  on public.follow_ups (due_date)
  where status = 'pending' and reminder_sent_at is null;
