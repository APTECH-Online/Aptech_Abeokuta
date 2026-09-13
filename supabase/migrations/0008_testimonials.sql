-- ============================================================================
-- APTECH Abeokuta — Testimonials CMS
-- Migration 0008: content table, storage bucket, seed existing static items
--
-- Additive only, same shape as migrations 0004/0006/0007 (Insights, Gallery,
-- Courses). Previously testimonial content was duplicated in two places —
-- a 3-item summary array in components/testimonials/Testimonials.tsx (shown
-- on the homepage) and a fuller 6-item array in
-- components/testimonials/TestimonialsPage.tsx (the full /testimonials
-- page) — both hardcoded, and out of sync with each other by design (the
-- homepage only ever showed the first 3). This migration seeds the union
-- (the fuller 6-item set) as the single source of truth; the homepage
-- component now just takes the first few published rows instead of
-- maintaining its own separate list.
-- ============================================================================

create table testimonials (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  program text not null,
  quote text not null,
  image_url text,

  -- Manual ordering, same pattern as gallery_items.sort_order.
  sort_order integer not null default 0,

  is_published boolean not null default true,
  uploaded_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint testimonials_name_length check (char_length(name) between 1 and 120),
  constraint testimonials_quote_length check (char_length(quote) between 1 and 2000)
);

create index idx_testimonials_published on testimonials (is_published);
create index idx_testimonials_sort_order on testimonials (sort_order);

create trigger trg_testimonials_updated_at before update on testimonials
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — same model as gallery_items: active staff can
-- SELECT; every write goes through the service-role client in
-- app/admin/(dashboard)/testimonials/actions.ts (canManageTestimonials).
-- Public reads use the service-role client from lib/testimonials-public.ts,
-- scoped to is_published = true.
-- ----------------------------------------------------------------------------

alter table testimonials enable row level security;

create policy "testimonials_select_staff" on testimonials
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- STORAGE — testimonial photos
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- SEED — the 6 testimonials previously hardcoded in
-- components/testimonials/TestimonialsPage.tsx, in their original order.
-- Existing image paths under /public/images/testimonials are preserved as
-- plain URLs (image_url isn't restricted to bucket-hosted files — same
-- reasoning as gallery_items.image_url).
-- ----------------------------------------------------------------------------

insert into testimonials (name, program, quote, image_url, sort_order, is_published)
values
  ('Lesley', 'ADSE', 'I''m so grateful for the supportive learning environment at Aptech. The instructors are always available to answer our questions and provide guidance, and my fellow students are incredibly talented and motivated. We''re all learning and growing together, and it''s an amazing experience.', '/images/testimonials/lesley.jpg', 1, true),
  ('James', 'ADSE', 'The ADSE program at Aptech is giving me the skills and confidence to pursue my dream of becoming a software engineer. I''m learning the latest technologies and best practices, and I''m building a strong foundation for a successful career in the tech industry.', '/images/testimonials/james.jpg', 2, true),
  ('Khalid', 'ADSE', 'I''m really impressed with the breadth and depth of the ADSE curriculum. We''re covering everything from database management to cloud computing, and I''m gaining a holistic understanding of the software development lifecycle. The instructors are experts in their field and provide great guidance and support.', '/images/testimonials/khalid.jpg', 3, true),
  ('Odafe', 'ADSE', 'The hands-on learning approach in the ADSE program is fantastic. We''re constantly working on real-world projects, which allows us to apply what we''re learning and build a strong portfolio. I''m also developing essential soft skills like teamwork and communication, which are crucial for success in the tech industry.', null, 4, true),
  ('Aanuoluwapo', 'ADSE', 'Aptech''s ADSE program is not just about technical skills; it''s also about developing a problem-solving mindset. We''re encouraged to think critically and creatively, and to come up with innovative solutions to complex challenges.', null, 5, true),
  ('Abdulbasit', 'ADSE', 'Aptech''s ADSE program is intense but incredibly rewarding. We''re diving deep into advanced software development concepts, learning industry-standard tools and technologies, and gaining experience that will be invaluable in my future career.', null, 6, true)
on conflict do nothing;
