-- ============================================================================
-- APTECH Abeokuta — CRM & Admissions Management System
-- Migration 0001: Core schema
--
-- Run this in the Supabase SQL editor, or via the Supabase CLI:
--   supabase db push
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

create type staff_role as enum (
  'super_admin',
  'admissions_manager',
  'admissions_officer',
  'counsellor',
  'viewer'
);

create type lead_status as enum (
  'new',
  'contacted',
  'interested',
  'counselling',
  'application_started',
  'application_submitted',
  'admission_offered',
  'enrolled',
  'follow_up_later',
  'not_interested',
  'unreachable',
  'lost'
);

create type lead_source as enum (
  'google',
  'facebook',
  'instagram',
  'whatsapp',
  'referral',
  'website',
  'walk_in',
  'advertisement',
  'other'
);

create type study_mode as enum (
  'full_time',
  'part_time',
  'weekend',
  'online',
  'hybrid'
);

create type interaction_type as enum (
  'call',
  'whatsapp',
  'email',
  'sms',
  'meeting',
  'note',
  'website'
);

create type follow_up_status as enum (
  'pending',
  'completed',
  'cancelled',
  'overdue'
);

create type application_status as enum (
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
  'enrolled'
);

create type programme_status as enum ('active', 'inactive');

-- ----------------------------------------------------------------------------
-- STAFF (application users / CRM operators)
-- Linked 1:1 with Supabase Auth users (auth.users.id). A row here is what
-- grants someone access to the CRM — creating an auth user alone is not
-- enough.
-- ----------------------------------------------------------------------------

create table staff (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role staff_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_staff_role on staff (role);
create index idx_staff_active on staff (is_active);

-- ----------------------------------------------------------------------------
-- PROGRAMMES
-- ----------------------------------------------------------------------------

create table programmes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  duration text,
  status programme_status not null default 'active',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_programmes_status on programmes (status);

-- ----------------------------------------------------------------------------
-- LEADS — one primary profile per prospective student
-- ----------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_reference text not null unique,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  gender text,
  date_of_birth date,

  address text,
  city text,
  state text,
  country text default 'Nigeria',

  status lead_status not null default 'new',
  source lead_source not null default 'website',

  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,

  assigned_to uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_email on leads (lower(email));
create index idx_leads_phone on leads (phone);
create index idx_leads_whatsapp on leads (whatsapp);
create index idx_leads_status on leads (status);
create index idx_leads_source on leads (source);
create index idx_leads_assigned_to on leads (assigned_to);
create index idx_leads_created_at on leads (created_at desc);
create unique index idx_leads_reference on leads (lead_reference);

-- ----------------------------------------------------------------------------
-- LEAD EDUCATION
-- ----------------------------------------------------------------------------

create table lead_education (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  highest_qualification text,
  institution text,
  graduation_year integer,
  previous_it_experience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lead_education_lead_id on lead_education (lead_id);

-- ----------------------------------------------------------------------------
-- LEAD INTERESTS — programme(s) + study preferences a lead expressed
-- ----------------------------------------------------------------------------

create table lead_interests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  programme_id uuid references programmes (id) on delete set null,
  study_mode study_mode,
  preferred_intake text,
  expected_start_date date,
  created_at timestamptz not null default now()
);

create index idx_lead_interests_lead_id on lead_interests (lead_id);
create index idx_lead_interests_programme_id on lead_interests (programme_id);

-- ----------------------------------------------------------------------------
-- APPLICATIONS
-- ----------------------------------------------------------------------------

create table applications (
  id uuid primary key default gen_random_uuid(),
  application_reference text not null unique,
  lead_id uuid not null references leads (id) on delete cascade,
  programme_id uuid references programmes (id) on delete set null,
  status application_status not null default 'submitted',
  assigned_to uuid references staff (id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_applications_lead_id on applications (lead_id);
create index idx_applications_programme_id on applications (programme_id);
create index idx_applications_status on applications (status);
create unique index idx_applications_reference on applications (application_reference);

-- ----------------------------------------------------------------------------
-- INTERACTIONS — full activity/communication history for a lead
-- ----------------------------------------------------------------------------

create table interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  user_id uuid references staff (id) on delete set null,
  type interaction_type not null,
  subject text,
  description text,
  created_at timestamptz not null default now()
);

create index idx_interactions_lead_id on interactions (lead_id, created_at desc);

-- ----------------------------------------------------------------------------
-- FOLLOW-UPS
-- ----------------------------------------------------------------------------

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  assigned_to uuid references staff (id) on delete set null,
  due_date timestamptz not null,
  type interaction_type not null default 'call',
  status follow_up_status not null default 'pending',
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_follow_ups_lead_id on follow_ups (lead_id);
create index idx_follow_ups_assigned_to on follow_ups (assigned_to);
create index idx_follow_ups_status on follow_ups (status);
create index idx_follow_ups_due_date on follow_ups (due_date);

-- ----------------------------------------------------------------------------
-- AUDIT LOG
-- ----------------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references staff (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs (entity, entity_id);
create index idx_audit_logs_created_at on audit_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_staff_updated_at before update on staff
  for each row execute function set_updated_at();
create trigger trg_programmes_updated_at before update on programmes
  for each row execute function set_updated_at();
create trigger trg_leads_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger trg_lead_education_updated_at before update on lead_education
  for each row execute function set_updated_at();
create trigger trg_applications_updated_at before update on applications
  for each row execute function set_updated_at();
create trigger trg_follow_ups_updated_at before update on follow_ups
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- All CRM read/write traffic in this application is served through Next.js
-- server actions / route handlers which authenticate the caller, resolve
-- their `staff` row, and enforce role checks in application code before ever
-- touching the database. Public lead submission is handled server-side with
-- the service-role key (never exposed to the browser) after validation and
-- rate limiting.
--
-- RLS is enabled on every table as defense-in-depth: even if a client ever
-- obtained a Supabase session and queried tables directly, access is limited
-- to authenticated, active staff. The anon key has NO table access at all —
-- anonymous visitors can only reach the database through the server actions
-- below, never directly.
-- ============================================================================

alter table staff enable row level security;
alter table programmes enable row level security;
alter table leads enable row level security;
alter table lead_education enable row level security;
alter table lead_interests enable row level security;
alter table applications enable row level security;
alter table interactions enable row level security;
alter table follow_ups enable row level security;
alter table audit_logs enable row level security;

-- Helper: is the current authenticated user an active staff member?
create or replace function is_active_staff()
returns boolean as $$
  select exists (
    select 1 from staff where id = auth.uid() and is_active = true
  );
$$ language sql stable security definer;

-- staff: everyone active-staff can read the directory; only super admins
-- can write (writes are also brokered by server actions with an explicit
-- role check, this is a second layer).
create policy "staff_select_active_staff" on staff
  for select using (is_active_staff());

create policy "staff_self_select" on staff
  for select using (id = auth.uid());

-- Every other table: active staff can select. All inserts/updates/deletes
-- from the browser are denied by RLS (no policy = deny); mutations happen
-- via server actions using the service-role key, which bypasses RLS by
-- design and re-implements authorization in TypeScript.
create policy "programmes_select_staff" on programmes
  for select using (is_active_staff());

create policy "leads_select_staff" on leads
  for select using (is_active_staff());

create policy "lead_education_select_staff" on lead_education
  for select using (is_active_staff());

create policy "lead_interests_select_staff" on lead_interests
  for select using (is_active_staff());

create policy "applications_select_staff" on applications
  for select using (is_active_staff());

create policy "interactions_select_staff" on interactions
  for select using (is_active_staff());

create policy "follow_ups_select_staff" on follow_ups
  for select using (is_active_staff());

create policy "audit_logs_select_staff" on audit_logs
  for select using (is_active_staff());
