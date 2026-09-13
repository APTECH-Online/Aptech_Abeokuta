-- ============================================================================
-- APTECH Abeokuta — FAQs CMS
-- Migration 0009: content table, seed existing static FAQs
--
-- Additive only, same shape as previous content migrations. Previously the
-- FAQ list lived hardcoded in data/site.ts, shown in full on the homepage
-- (components/home/FAQSection.tsx) and as the first 3 entries on the
-- Admissions page. No image/storage bucket needed — this is text-only
-- content.
-- ============================================================================

create table faqs (
  id uuid primary key default gen_random_uuid(),

  question text not null,
  answer text not null,

  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references staff (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint faqs_question_length check (char_length(question) between 1 and 300),
  constraint faqs_answer_length check (char_length(answer) between 1 and 2000)
);

create index idx_faqs_published on faqs (is_published);
create index idx_faqs_sort_order on faqs (sort_order);

create trigger trg_faqs_updated_at before update on faqs
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — same model as testimonials/gallery: active staff can
-- SELECT; every write goes through the service-role client in
-- app/admin/(dashboard)/faqs/actions.ts (canManageFaqs). Public reads use
-- the service-role client from lib/faqs-public.ts, scoped to
-- is_published = true.
-- ----------------------------------------------------------------------------

alter table faqs enable row level security;

create policy "faqs_select_staff" on faqs
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- SEED — the 5 FAQs previously hardcoded in data/site.ts, in their
-- original order. The admissions page previously showed faqs.slice(0, 3) —
-- the public data layer preserves that by taking the first 3 by
-- sort_order, so which FAQs show there doesn't silently change.
-- ----------------------------------------------------------------------------

insert into faqs (question, answer, sort_order, is_published)
values
  ('Do I need prior IT experience to enrol?', 'Entry requirements vary by programme. The course catalogue lists the recommended level for each programme, and admissions can confirm the current requirements for your chosen track.', 1, true),
  ('How are classes delivered?', 'Classes combine instructor-led teaching with hands-on lab time. Exact schedule and delivery format for a given cohort are confirmed by the admissions office.', 2, true),
  ('What happens after I apply?', 'The admissions team reviews your application and contacts you to confirm your programme, intake, and any outstanding requirements.', 3, true),
  ('Are there flexible payment options?', 'Fee structures and payment plans are confirmed directly with the admissions office, since they can vary by programme.', 4, true),
  ('Will I receive a certificate?', 'Students who complete a programme''s requirements receive a certificate of completion. Ask the admissions office for details specific to your track.', 5, true)
on conflict do nothing;
