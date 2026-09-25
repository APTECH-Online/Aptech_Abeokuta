-- ============================================================================
-- APTECH Abeokuta — Strict staff RBAC
-- Migration 0014: Super Admin / Content Manager / Admissions Officer
--
-- This migration keeps the existing Supabase Auth setup and staff table, but
-- makes the three supported staff roles explicit and applies the same role
-- boundaries at both the application and database/RLS layers.
-- ============================================================================

alter type staff_role add value if not exists 'content_manager';

-- Existing pre-RBAC roles are folded into the closest supported operational
-- role so old staff accounts do not become unusable after deployment.
update staff
set role = 'admissions_officer'
where role in ('admissions_manager', 'counsellor', 'viewer');

update staff
set can_manage_insights = (role in ('super_admin', 'content_manager'));

create or replace function current_staff_role()
returns staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from staff
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

revoke all on function current_staff_role() from public;
grant execute on function current_staff_role() to authenticated;

-- --------------------------------------------------------------------------
-- STAFF DIRECTORY
-- Only Super Admins may list/manage staff. A staff member can still read
-- their own row so the server-side session resolver continues to work.
-- --------------------------------------------------------------------------

drop policy if exists "staff_select_active_staff" on staff;
drop policy if exists "staff_self_select" on staff;
create policy "staff_select_self_or_super_admin" on staff
  for select using (
    id = auth.uid()
    or current_staff_role() = 'super_admin'
  );

-- --------------------------------------------------------------------------
-- CONTENT — News / Blog / Insights
-- In the current CRM these content records live in `insights`; its existing
-- content types/categories continue to represent the public News/Blog/Insights
-- content without changing the public URLs or CMS editor.
-- --------------------------------------------------------------------------

drop policy if exists "insights_select_staff" on insights;
create policy "insights_select_content_manager_or_super_admin" on insights
  for select using (current_staff_role() in ('super_admin', 'content_manager'));

-- --------------------------------------------------------------------------
-- ADMISSIONS / CRM — Enquiries, Applications, Follow-ups
-- --------------------------------------------------------------------------

-- Leads and all supporting lead/application activity.
drop policy if exists "leads_select_staff" on leads;
create policy "leads_select_admissions_or_super_admin" on leads
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

drop policy if exists "lead_education_select_staff" on lead_education;
create policy "lead_education_select_admissions_or_super_admin" on lead_education
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

drop policy if exists "lead_interests_select_staff" on lead_interests;
create policy "lead_interests_select_admissions_or_super_admin" on lead_interests
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

drop policy if exists "applications_select_staff" on applications;
create policy "applications_select_admissions_or_super_admin" on applications
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

drop policy if exists "interactions_select_staff" on interactions;
create policy "interactions_select_admissions_or_super_admin" on interactions
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

drop policy if exists "follow_ups_select_staff" on follow_ups;
create policy "follow_ups_select_admissions_or_super_admin" on follow_ups
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

-- --------------------------------------------------------------------------
-- EVERYTHING ELSE IN THE ADMIN CRM IS SUPER-ADMIN ONLY.
-- These policies are defense-in-depth. Server actions continue to use the
-- service-role client only after explicit authorization checks in TypeScript.
-- --------------------------------------------------------------------------

drop policy if exists "programmes_select_staff" on programmes;
create policy "programmes_select_super_admin" on programmes
  for select using (current_staff_role() = 'super_admin');

drop policy if exists "audit_logs_select_staff" on audit_logs;
create policy "audit_logs_select_super_admin" on audit_logs
  for select using (current_staff_role() = 'super_admin');

drop policy if exists "notifications_select_staff" on notifications;
create policy "notifications_select_super_admin" on notifications
  for select using (current_staff_role() = 'super_admin');

drop policy if exists "notification_reads_select_own" on notification_reads;
create policy "notification_reads_select_super_admin" on notification_reads
  for select using (current_staff_role() = 'super_admin');

drop policy if exists "courses_select_staff" on courses;
create policy "courses_select_super_admin" on courses
  for select using (current_staff_role() = 'super_admin');

drop policy if exists "gallery_select_staff" on gallery_items;
create policy "gallery_select_super_admin" on gallery_items
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "faqs_select_staff" on faqs;
create policy "faqs_select_super_admin" on faqs
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "testimonials_select_staff" on testimonials;
create policy "testimonials_select_super_admin" on testimonials
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "social_links_select_staff" on social_links;
create policy "social_links_select_super_admin" on social_links
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "partner_organizations_select_staff" on partner_organizations;
create policy "partner_organizations_select_super_admin" on partner_organizations
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "affiliated_universities_select_staff" on affiliated_universities;
create policy "affiliated_universities_select_super_admin" on affiliated_universities
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "partners_highlight_select_staff" on partners_highlight;
create policy "partners_highlight_select_super_admin" on partners_highlight
  for select using (current_staff_role() = 'super_admin');
drop policy if exists "contact_info_select_staff" on contact_info;
create policy "contact_info_select_super_admin" on contact_info
  for select using (current_staff_role() = 'super_admin');

-- No browser policy grants INSERT/UPDATE/DELETE. Mutations remain server-side
-- through authenticated Next.js server actions using the service-role client.

alter table staff alter column role set default 'admissions_officer';
