-- ============================================================================
-- APTECH Abeokuta — Legal documents (Privacy Policy / Terms) + consent ledger
-- Migration 0031
--
-- 1. legal_documents: versioned, staff-editable Privacy Policy and Terms.
--    Exactly one row per slug may be 'published' at a time. The public pages
--    (/privacy, /terms) read the published row and fall back to the defaults
--    in data/legal.ts if the table is empty or unreadable.
-- 2. lead_consents: append-only ledger of what each person agreed to, which
--    policy versions were live at that moment, and from which form.
-- 3. leads: two denormalised columns for quick filtering in the CRM.
-- ============================================================================

create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug in ('privacy', 'terms')),
  version integer not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text not null check (char_length(title) between 1 and 200),
  summary text check (summary is null or char_length(summary) <= 1000),
  -- [{ "heading": "...", "body": "paragraphs separated by blank lines; lines starting '- ' are bullets" }]
  sections jsonb not null default '[]'::jsonb,
  effective_date date,
  change_summary text check (change_summary is null or char_length(change_summary) <= 1000),
  published_at timestamptz,
  published_by uuid references staff (id) on delete set null,
  created_by uuid references staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, version)
);

-- Only one live version per document.
create unique index if not exists legal_documents_one_published
  on legal_documents (slug) where status = 'published';

create trigger trg_legal_documents_updated_at before update on legal_documents
  for each row execute function set_updated_at();

alter table legal_documents enable row level security;

create policy "legal_documents_select_staff" on legal_documents
  for select using (is_active_staff());

-- Consent ledger ----------------------------------------------------------------

create table if not exists lead_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  form_source text not null check (form_source in ('admissions', 'contact', 'career_quiz', 'tech_zone')),
  privacy_accepted boolean not null default true,
  marketing_opt_in boolean not null default false,
  privacy_version integer,
  terms_version integer,
  -- True when the applicant's date of birth indicates they are under 18.
  minor_flag boolean not null default false,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists lead_consents_lead_idx on lead_consents (lead_id, created_at desc);

alter table lead_consents enable row level security;

create policy "lead_consents_select_staff" on lead_consents
  for select using (is_active_staff());

-- Quick-filter columns on leads --------------------------------------------------

alter table leads
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false;
