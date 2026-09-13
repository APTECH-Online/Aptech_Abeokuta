-- ============================================================================
-- APTECH Abeokuta — Photo Gallery CMS
-- Migration 0006: content table, storage bucket, seed existing static items
--
-- Additive only, same shape as migration 0004 (Insights). The public
-- /gallery page and components/gallery/Gallery.tsx previously read from a
-- hardcoded array in the component file — this moves that content into the
-- CRM so staff can add, edit, reorder and remove photos without a deploy.
-- ============================================================================

create type gallery_display_size as enum ('feature', 'tall', 'standard');

-- ----------------------------------------------------------------------------
-- GALLERY ITEMS
-- ----------------------------------------------------------------------------

create table gallery_items (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  category text not null,
  alt_text text not null,
  image_url text not null,
  display_size gallery_display_size not null default 'standard',

  -- Manual ordering within the public grid. Lower shows first. New items
  -- default to the back of the line via a trigger-free approach: the admin
  -- action computes max(sort_order) + 1 at insert time.
  sort_order integer not null default 0,

  is_published boolean not null default true,
  uploaded_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint gallery_items_title_length check (char_length(title) between 1 and 200),
  constraint gallery_items_alt_text_length check (char_length(alt_text) between 1 and 300)
);

create index idx_gallery_items_published on gallery_items (is_published);
create index idx_gallery_items_category on gallery_items (category);
create index idx_gallery_items_sort_order on gallery_items (sort_order);

create trigger trg_gallery_items_updated_at before update on gallery_items
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — same model as insights (migration 0004): active
-- staff can SELECT; every write goes through the service-role client in
-- app/admin/(dashboard)/gallery/actions.ts, which re-implements the real
-- authorization check (canManageGallery) in TypeScript. Public reads use
-- the service-role client from lib/gallery-public.ts, scoped to
-- is_published = true.
-- ----------------------------------------------------------------------------

alter table gallery_items enable row level security;

create policy "gallery_items_select_staff" on gallery_items
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- STORAGE — gallery photos
--
-- Public bucket, same reasoning as the 'insights' bucket: <Image> on the
-- public site loads directly from the Supabase CDN URL, and uploads only
-- ever happen server-side via the service-role client.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Preserve the photos already referenced from the old hardcoded array in
-- components/gallery/Gallery.tsx so the public page keeps showing the same
-- images once it switches to reading from this table. These point at the
-- existing files under /public/images/gallery (and two placeholder
-- illustrations) rather than the Supabase storage bucket — image_url is a
-- plain URL/path column, not restricted to bucket-hosted files.
insert into gallery_items (title, category, alt_text, image_url, display_size, sort_order, is_published)
values
  ('Aptech Career Quest, 16th edition', 'Events', 'A group of students at the APTECH Career Quest event, held in association with Middlesex University', '/images/gallery/event-1.jpg', 'feature', 1, true),
  ('Around the campus', 'Campus', 'A student walking through a corridor on the APTECH Abeokuta campus', '/images/gallery/campus-1.jpg', 'tall', 2, true),
  ('Hands-on with the tools of the trade', 'Students', 'A student working at a laptop on campus', '/images/gallery/staff-1.jpg', 'standard', 3, true),
  ('The admin office', 'Campus', 'A staff member working at a desk in the campus office', '/images/gallery/staff-2.jpg', 'standard', 4, true),
  ('Students building practical skills', 'Learning', 'Illustration of a student working with a laptop, code panels and a data chart', '/images/about-illustration.svg', 'tall', 5, true),
  ('The APTECH standard', 'Learning', 'Illustration representing technology-focused learning', '/images/hero-tech.svg', 'standard', 6, true)
on conflict do nothing;
