-- ============================================================================
-- APTECH Abeokuta — Partners & Alliances / Affiliated Universities CMS
-- Migration 0011: content tables, storage bucket, seed existing static content
--
-- Additive only, same shape as 0006 (Gallery) and 0010 (Social links). Three
-- pieces of content previously hardcoded in app/(site)/page.tsx,
-- app/(site)/about/page.tsx and components/shared/PartnerLogos.tsx move here:
--
--   1. partner_organizations — the "Industry partners" text cards on the
--      About page (Avigo Investment Limited, the Middlesex/Portsmouth
--      alliance).
--   2. affiliated_universities — the logo grid ("Affiliated universities")
--      shown on both the Home and About pages.
--   3. partners_highlight — the single "Backed by Avigo Investment
--      Limited..." card on the homepage, including its button label/link.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTNER ORGANIZATIONS
-- ----------------------------------------------------------------------------

create table partner_organizations (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  body text not null,
  -- Short bullet list under each card (e.g. "100% Nigerian-Owned"). Plain
  -- text[] rather than a child table — same reasoning as gallery/faqs:
  -- there's no need to query into individual bullets.
  points text[] not null default '{}',

  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_organizations_title_length check (char_length(title) between 1 and 200),
  constraint partner_organizations_body_length check (char_length(body) between 1 and 1000),
  constraint partner_organizations_points_count check (array_length(points, 1) is null or array_length(points, 1) <= 10)
);

create index idx_partner_organizations_published on partner_organizations (is_published);
create index idx_partner_organizations_sort_order on partner_organizations (sort_order);

create trigger trg_partner_organizations_updated_at before update on partner_organizations
  for each row execute function set_updated_at();

alter table partner_organizations enable row level security;

create policy "partner_organizations_select_staff" on partner_organizations
  for select using (is_active_staff());

-- Preserve the two cards previously hardcoded in the `partners` array in
-- app/(site)/about/page.tsx.
insert into partner_organizations (title, body, points, sort_order, is_published)
values
  (
    'Avigo Investment Limited',
    'AVIGO, a Nigerian environmental and IT services firm, provides network solutions and employs a diverse team of tech professionals.',
    array['100% Nigerian-Owned', 'Diverse Team of Professionals', 'Leading Environmental and Allied Services Company'],
    1,
    true
  ),
  (
    'Our Alliance',
    'Avigo prioritizes quality and excellence. Aptech Abeokuta partners with Middlesex and Portsmouth Universities, offering students a pathway to a BSc in Software Engineering.',
    array['Global Reach and Networking', 'Academic Excellence and Research Opportunities', 'Industry Connections and Job Prospects'],
    2,
    true
  )
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- AFFILIATED UNIVERSITIES
-- ----------------------------------------------------------------------------

create table affiliated_universities (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  logo_url text not null,
  -- Optional: makes the logo clickable through to the partner university's
  -- own site. Left null keeps the logo static, matching current behaviour.
  website_url text,

  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint affiliated_universities_name_length check (char_length(name) between 1 and 150),
  constraint affiliated_universities_website_url_length check (website_url is null or char_length(website_url) <= 500)
);

create index idx_affiliated_universities_published on affiliated_universities (is_published);
create index idx_affiliated_universities_sort_order on affiliated_universities (sort_order);

create trigger trg_affiliated_universities_updated_at before update on affiliated_universities
  for each row execute function set_updated_at();

alter table affiliated_universities enable row level security;

create policy "affiliated_universities_select_staff" on affiliated_universities
  for select using (is_active_staff());

-- Public bucket, same reasoning as 'gallery': the public site loads these
-- directly as <Image> src URLs, and uploads only ever happen server-side
-- via the service-role client (lib/supabase/partner-logo-storage.ts).
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;

-- Preserve the four logos previously hardcoded in
-- components/shared/PartnerLogos.tsx. These point at the existing files
-- under /public/images/partners rather than the new storage bucket —
-- logo_url is a plain URL/path column, not restricted to bucket-hosted
-- files (same convention as gallery_items.image_url).
insert into affiliated_universities (name, logo_url, sort_order, is_published)
values
  ('Bangor University', '/images/partners/bangor.png', 1, true),
  ('ISM International School of Management', '/images/partners/ism.png', 2, true),
  ('University of Bolton', '/images/partners/bolton.png', 3, true),
  ('Lincoln University College', '/images/partners/lincoln.png', 4, true)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- PARTNERS HIGHLIGHT — the homepage card. A single editable row rather than
-- a list; the admin UI always loads/updates the earliest row and creates one
-- on first save if none exists yet, so there's no separate "new" flow.
-- ----------------------------------------------------------------------------

create table partners_highlight (
  id uuid primary key default gen_random_uuid(),

  headline text not null,
  description text not null,
  cta_label text not null,
  cta_href text not null,

  is_published boolean not null default true,
  updated_by uuid references staff (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger trg_partners_highlight_updated_at before update on partners_highlight
  for each row execute function set_updated_at();

alter table partners_highlight enable row level security;

create policy "partners_highlight_select_staff" on partners_highlight
  for select using (is_active_staff());

-- Preserve the copy previously hardcoded in the homepage card in
-- app/(site)/page.tsx.
insert into partners_highlight (headline, description, cta_label, cta_href, is_published)
values (
  'Backed by Avigo Investment Limited, connected to Middlesex & Portsmouth Universities',
  'A Nigerian-owned network partner, plus a pathway to a BSc in Software Engineering through our university alliance.',
  'Meet our partners',
  '/about#partners',
  true
)
on conflict do nothing;
