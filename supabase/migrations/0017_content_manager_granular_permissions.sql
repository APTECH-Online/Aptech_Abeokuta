-- ============================================================================
-- APTECH Abeokuta — Granular Content Manager permissions
-- Migration 0017
--
-- Context: migration 0014 introduced the `content_manager` role but gave it
-- only one on/off switch (staff.can_manage_insights). This migration replaces
-- that single switch with a centrally-defined, per-action permission set so a
-- Super Admin can grant a Content Manager exactly the modules/actions they
-- need (News, Events, Programs/Courses, Media, FAQs, Website content, and —
-- if explicitly granted — Enquiries/Applications/Follow-ups), without
-- creating a second authentication system and without touching the
-- Super Admin or Admissions Officer paths.
--
-- Design notes (see lib/permissions.ts for the source of truth):
--   * Permissions are stored as one JSONB map per staff row:
--       staff.permissions = { "news.view": true, "news.publish": false, ... }
--     This mirrors the existing pattern used for Admissions Officer grants
--     (four boolean columns added in 0016) rather than introducing a
--     separate roles/permissions/role_permissions join-table schema — that
--     would be a second, parallel authorization system running next to the
--     boolean-flag approach already in production. A JSONB map keeps a
--     single row-per-staff model, is trivially reusable/centrally defined in
--     TypeScript (see lib/permissions.ts), and needs no joins to check.
--   * `permissions` only carries meaning for role = 'content_manager'.
--     Super Admin is always fully authorized (enforced in application code
--     and in staff_has_permission() below) and Admissions Officer keeps its
--     existing four boolean flags from 0016, untouched by this migration.
--   * Content Managers do NOT get CRM (Enquiries/Applications/Follow-ups)
--     access merely by holding the role — but CAN be granted it via this
--     same permission map, per the "granular CRM permissions" requirement.
-- ============================================================================

alter table staff add column if not exists permissions jsonb not null default '{}'::jsonb;

comment on column staff.permissions is
  'Per-action Content Manager permission grants, e.g. {"news.view": true}. '
  'Meaningless for other roles: Super Admin is always fully authorized and '
  'Admissions Officer uses the dedicated can_* columns from migration 0016.';

-- ----------------------------------------------------------------------------
-- Backfill: existing Content Managers who had the old blanket
-- can_manage_insights flag keep equivalent access (News + Events + Media),
-- matching the suggested defaults in the spec. Everything else (Programs,
-- Website content, FAQs, all CRM modules) defaults to denied and must be
-- explicitly granted by a Super Admin.
-- ----------------------------------------------------------------------------

update staff
set permissions = jsonb_build_object(
  'news.view', true, 'news.create', true, 'news.edit', true,
  'news.publish', true, 'news.unpublish', true, 'news.delete', true,
  'events.view', true, 'events.create', true, 'events.edit', true,
  'events.publish', true, 'events.unpublish', true, 'events.delete', true,
  'media.view', true, 'media.upload', true, 'media.replace', true, 'media.delete', true
)
where role = 'content_manager'
  and can_manage_insights = true
  and permissions = '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- staff_has_permission(): the single, reusable authorization check used by
-- RLS policies below. Mirrors the TypeScript hasPermission() helper in
-- lib/permissions.ts so the database and application layers agree:
--   * Super Admin -> always true (never locked out by a missing permission
--     row or a stale/omitted key).
--   * Content Manager -> looks up the flat permissions map.
--   * Anyone else (Admissions Officer, inactive staff, no staff row) -> false
--     for these keys; Admissions Officer access continues to be governed by
--     its own RLS policies + the 0016 boolean columns, unaffected by this.
-- ----------------------------------------------------------------------------

create or replace function staff_has_permission(perm_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when s.role = 'super_admin' then true
        when s.role = 'content_manager' then coalesce((s.permissions ->> perm_key)::boolean, false)
        else false
      end
      from staff s
      where s.id = auth.uid()
        and s.is_active = true
      limit 1
    ),
    false
  );
$$;

revoke all on function staff_has_permission(text) from public;
grant execute on function staff_has_permission(text) to authenticated;

-- ----------------------------------------------------------------------------
-- CMS — extend SELECT policies so a Content Manager with the matching "view"
-- permission can read these tables (previously Super Admin only). Mutations
-- remain server-side via the service-role client, gated in TypeScript by
-- lib/auth.ts's requireCoursesAccess/requireGalleryAccess/requireFaqsAccess/
-- requireWebsiteContentAccess — this RLS change is defense-in-depth, matching
-- the existing pattern noted in migration 0014.
-- ----------------------------------------------------------------------------

drop policy if exists "courses_select_super_admin" on courses;
create policy "courses_select_super_admin_or_permitted" on courses
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('courses.view')
  );

drop policy if exists "gallery_select_super_admin" on gallery_items;
create policy "gallery_select_super_admin_or_permitted" on gallery_items
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('media.view')
  );

drop policy if exists "faqs_select_super_admin" on faqs;
create policy "faqs_select_super_admin_or_permitted" on faqs
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('faqs.view')
  );

drop policy if exists "social_links_select_super_admin" on social_links;
create policy "social_links_select_super_admin_or_permitted" on social_links
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('website_content.view')
  );

drop policy if exists "contact_info_select_super_admin" on contact_info;
create policy "contact_info_select_super_admin_or_permitted" on contact_info
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('website_content.view')
  );

drop policy if exists "partner_organizations_select_super_admin" on partner_organizations;
create policy "partner_organizations_select_super_admin_or_permitted" on partner_organizations
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('website_content.view')
  );

drop policy if exists "affiliated_universities_select_super_admin" on affiliated_universities;
create policy "affiliated_universities_select_super_admin_or_permitted" on affiliated_universities
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('website_content.view')
  );

drop policy if exists "partners_highlight_select_super_admin" on partners_highlight;
create policy "partners_highlight_select_super_admin_or_permitted" on partners_highlight
  for select using (
    current_staff_role() = 'super_admin' or staff_has_permission('website_content.view')
  );

-- ----------------------------------------------------------------------------
-- CRM — a Content Manager still gets nothing here by default (permissions
-- jsonb defaults to '{}', so staff_has_permission() returns false for every
-- CRM key), but can now be granted individual module access without a role
-- change, exactly as required. Admissions Officer keeps unconditional access
-- via its existing clause.
-- ----------------------------------------------------------------------------

drop policy if exists "leads_select_admissions_or_super_admin" on leads;
create policy "leads_select_admissions_super_admin_or_permitted" on leads
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('enquiries.view')
  );

drop policy if exists "lead_education_select_admissions_or_super_admin" on lead_education;
create policy "lead_education_select_admissions_super_admin_or_permitted" on lead_education
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('enquiries.view')
  );

drop policy if exists "lead_interests_select_admissions_or_super_admin" on lead_interests;
create policy "lead_interests_select_admissions_super_admin_or_permitted" on lead_interests
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('enquiries.view')
  );

drop policy if exists "interactions_select_admissions_or_super_admin" on interactions;
create policy "interactions_select_admissions_super_admin_or_permitted" on interactions
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('enquiries.view')
  );

drop policy if exists "applications_select_admissions_or_super_admin" on applications;
create policy "applications_select_admissions_super_admin_or_permitted" on applications
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('applications.view')
  );

drop policy if exists "follow_ups_select_admissions_or_super_admin" on follow_ups;
create policy "follow_ups_select_admissions_super_admin_or_permitted" on follow_ups
  for select using (
    current_staff_role() in ('super_admin', 'admissions_officer') or staff_has_permission('follow_ups.view')
  );

-- ----------------------------------------------------------------------------
-- Audit trail: no new table needed. Permission grant/revoke events are
-- recorded through the existing generic `audit_logs` table via lib/audit.ts
-- (action = 'staff.content_manager_permissions_updated'), exactly like every
-- other staff/permission change already logged in this codebase.
-- ----------------------------------------------------------------------------
