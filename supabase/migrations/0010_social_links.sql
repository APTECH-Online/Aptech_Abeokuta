-- ============================================================================
-- APTECH Abeokuta — Social media links CMS
-- Migration 0010: content table, seed the existing hardcoded Facebook link
--
-- Additive only, same shape as previous content migrations (see 0009_faqs.sql).
-- Previously the social links lived hardcoded in data/site.ts (siteConfig.social)
-- and were rendered directly in components/footer/Footer.tsx. That required a
-- code change (and a deploy) to add, edit, or remove a channel. This table
-- moves that content into the CRM at /admin/settings/social so authorized
-- staff can manage it without touching the source.
-- ============================================================================

create table social_links (
  id uuid primary key default gen_random_uuid(),

  -- A fixed set of known platforms gets a purpose-built icon on the public
  -- site (see components/footer/SocialIcons.tsx). 'other' covers any channel
  -- outside that set and requires a label to show next to its generic icon.
  platform text not null check (
    platform in ('facebook', 'instagram', 'twitter_x', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'other')
  ),
  -- Optional display name. Required (enforced in the CRM form/action, not
  -- here, to keep the DB constraint simple) when platform = 'other'; for the
  -- known platforms it just overrides the default label if set.
  label text,
  url text not null,

  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint social_links_url_length check (char_length(url) between 1 and 500),
  constraint social_links_label_length check (label is null or char_length(label) <= 100)
);

create index idx_social_links_published on social_links (is_published);
create index idx_social_links_sort_order on social_links (sort_order);

create trigger trg_social_links_updated_at before update on social_links
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — same model as faqs/testimonials/gallery: active staff
-- can SELECT; every write goes through the service-role client in
-- app/admin/(dashboard)/settings/social/actions.ts (canManageSocialLinks).
-- Public reads use the service-role client from lib/social-links-public.ts,
-- scoped to is_published = true.
-- ----------------------------------------------------------------------------

alter table social_links enable row level security;

create policy "social_links_select_staff" on social_links
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- SEED — the single Facebook link previously hardcoded in data/site.ts, so
-- the public footer keeps showing exactly what it showed before this
-- migration ran.
-- ----------------------------------------------------------------------------

insert into social_links (platform, label, url, sort_order, is_published)
values
  ('facebook', null, 'https://www.facebook.com/aptechabk/', 1, true)
on conflict do nothing;
