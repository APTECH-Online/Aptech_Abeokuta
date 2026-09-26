-- ============================================================================
-- APTECH Abeokuta — Granular Admissions Officer permissions
-- Migration 0016
--
-- Previously an Admissions Officer's ability to update a lead's pipeline
-- status, log an interaction (timeline entry), start an application, or
-- schedule a follow-up was a single blanket "is this role admissions_officer
-- or super_admin?" check (lib/auth.ts canEditLead). There was no way for a
-- Super Admin to grant/revoke any one of those actions for a specific
-- Admissions Officer without changing their role entirely.
--
-- This adds four independent, per-staff-member boolean flags. They default
-- to true so every existing Admissions Officer keeps exactly the access they
-- already have; a Super Admin can then uncheck any of them from
-- /admin/staff → Manage Permissions at any time. Super Admins are always
-- fully permitted regardless of these flags — the flags only ever narrow an
-- Admissions Officer's access, never widen anyone else's, and they have no
-- effect unless the staff member already has Admissions module access
-- (staff_role = 'admissions_officer').
-- ============================================================================

alter table staff
  add column if not exists can_update_lead_status boolean not null default true,
  add column if not exists can_log_interactions boolean not null default true,
  add column if not exists can_start_applications boolean not null default true,
  add column if not exists can_schedule_follow_ups boolean not null default true;

comment on column staff.can_update_lead_status is 'Admissions Officer only: allowed to change a lead''s pipeline status. Super Admins are unaffected by this flag.';
comment on column staff.can_log_interactions is 'Admissions Officer only: allowed to log interactions / add timeline entries on a lead. Super Admins are unaffected by this flag.';
comment on column staff.can_start_applications is 'Admissions Officer only: allowed to start (create) an application for a lead. Super Admins are unaffected by this flag.';
comment on column staff.can_schedule_follow_ups is 'Admissions Officer only: allowed to schedule follow-ups for a lead. Super Admins are unaffected by this flag.';
