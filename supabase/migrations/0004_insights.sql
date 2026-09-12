-- ============================================================================
-- APTECH Abeokuta — Insights & Events CMS
-- Migration 0004: content table, permissions, storage
--
-- Additive only. Does not touch leads/applications/staff data, does not
-- alter existing tables' columns or drop anything. Safe to run against the
-- existing schema from 0001-0003.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

create type insight_status as enum (
  'draft',
  'scheduled',
  'published',
  'archived'
);

-- "category" (Career Guides, News, Announcements, ...) stays a free-form
-- text column rather than an enum: the public site already has its own
-- established category taxonomy (see data/insights.ts) and content
-- managers should be able to introduce new categories over time without a
-- schema migration. Valid values are enforced in application code
-- (lib/validation.ts) instead. content_type below IS an enum because it
-- drives structural UI differences (event fields vs. a plain article) and
-- is a fixed, small set.
create type insight_content_type as enum (
  'news',
  'announcement',
  'event',
  'academic_update',
  'spotlight',
  'achievement',
  'career_update',
  'celebration'
);

-- ----------------------------------------------------------------------------
-- STAFF — add a granular content-management permission
--
-- Rather than adding a new value to the existing `staff_role` enum, we use
-- a dedicated boolean flag. Several existing permission helpers in
-- lib/auth.ts (canEditLead, canExportData) grant access to anyone whose
-- role is not 'viewer', which is fine for the modules they guard but would
-- be wrong for Insights: a role added purely for content management must
-- NOT incidentally unlock leads/applications access via those checks. A
-- flag orthogonal to `role` avoids that, and is additive/reversible.
-- super_admin can always manage insights regardless of this flag (see
-- canManageInsights() in lib/auth.ts).
-- ----------------------------------------------------------------------------

alter table staff add column if not exists can_manage_insights boolean not null default false;

-- ----------------------------------------------------------------------------
-- INSIGHTS — News, Announcements, Events, Academic Updates, Spotlights,
-- Achievements, Career/Industry Updates, Celebrations. Events are a
-- first-class content_type on this same table (see event_* columns) rather
-- than a separate table, per the "no second CMS" requirement.
-- ----------------------------------------------------------------------------

create table insights (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  slug text not null,
  short_description text,
  content text not null default '',
  featured_image text,
  category text not null,
  content_type insight_content_type not null default 'news',

  author_id uuid references staff (id) on delete set null,

  status insight_status not null default 'draft',
  is_featured boolean not null default false,
  -- Lower number = shown first when multiple items are featured at once.
  featured_priority integer not null default 0,

  publish_at timestamptz,
  expires_at timestamptz,

  -- SEO (extends the existing lib/structured-data.ts conventions rather
  -- than duplicating them — see the new articleJsonLd/eventJsonLd helpers
  -- there). Both fall back to title/short_description when left blank.
  seo_title text,
  seo_description text,

  -- Event-specific fields, populated only when content_type = 'event'.
  event_start_at timestamptz,
  event_end_at timestamptz,
  event_venue text,
  event_registration_url text,
  event_contact text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint insights_slug_unique unique (slug),
  constraint insights_title_length check (char_length(title) between 1 and 200),
  constraint insights_expiry_after_publish
    check (expires_at is null or publish_at is null or expires_at > publish_at),
  constraint insights_event_end_after_start
    check (event_end_at is null or event_start_at is null or event_end_at >= event_start_at)
);

create index idx_insights_status on insights (status);
create index idx_insights_category on insights (category);
create index idx_insights_content_type on insights (content_type);
create index idx_insights_publish_at on insights (publish_at);
create index idx_insights_expires_at on insights (expires_at);
create index idx_insights_featured on insights (is_featured) where is_featured = true;
create index idx_insights_author on insights (author_id);
-- Speeds up the public "Upcoming Events" query (status + type + start date).
create index idx_insights_upcoming_events on insights (event_start_at)
  where content_type = 'event' and status = 'published';

create trigger trg_insights_updated_at before update on insights
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- Same model as every other table in this project (see migration 0001):
-- active staff can SELECT; all writes happen through Next.js server
-- actions using the service-role client, which bypasses RLS and
-- re-implements the real authorization check (canManageInsights) in
-- TypeScript. Public reads also go through the service-role client from
-- trusted server-only code (see lib/insights-public.ts), scoped to
-- published/non-expired rows and a safe field list — the anon key itself
-- has no table access at all, identical to the rest of this schema.
-- ----------------------------------------------------------------------------

alter table insights enable row level security;

create policy "insights_select_staff" on insights
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- STORAGE — featured images for insights/events
--
-- Public bucket so <Image> on the public site can load featured images
-- directly from the Supabase CDN URL. Uploads are never done from the
-- browser: components/admin/InsightForm.tsx submits the file as part of
-- the server action's FormData, and the action uploads it using the
-- service-role client (lib/supabase/admin.ts), same as every other
-- privileged mutation in this app.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('insights', 'insights', true)
on conflict (id) do nothing;

-- Preserve existing static /insights content (from data/insights.ts) so
-- existing public URLs keep working once the site reads from this table.
-- Safe to re-run: slug is unique, so this only inserts rows that don't exist yet.
insert into insights (title, slug, short_description, content, category, content_type, status, publish_at, is_featured)
values
  ('How to Become a Software Developer in Nigeria', 'how-to-become-a-software-developer-in-nigeria', 'A practical, step-by-step look at the skills, learning path and portfolio work that actually matter for landing a software development role in Nigeria today.', '<p>Software development remains one of the most accessible tech careers to break into without a traditional computer science degree, because employers in Nigeria''s fast-growing tech sector generally care more about what you can build than which certificate hangs on your wall.</p><p>Start with programming fundamentals — variables, control flow, functions and basic data structures — in one language before spreading yourself across many. Most learners do this with a general-purpose language like Python or Java, or go straight into web fundamentals with HTML, CSS and JavaScript if front-end work appeals to you.</p><p>From there, pick a specialisation: front-end (React and modern JavaScript), back-end (a language like Java, C# or Python paired with databases and APIs), or full-stack. Structured programmes such as the Advanced Diploma in Software Engineering are built specifically to take a beginner through this progression in order, rather than leaving you to guess which topic to learn next.</p><p>A portfolio matters more than most beginners expect. Two or three well-documented projects — even simple ones — that you can explain in an interview will do more for your job prospects than a long list of tutorials watched. Building real, working software, including the debugging and testing that goes with it, is what separates someone who has ''learned about'' programming from someone who can actually do the job.</p><p>Finally, treat the learning curve as ongoing. The tools and frameworks used in professional development change every few years; the constant is a solid grasp of fundamentals and the habit of learning independently once you are employed.</p>', 'Career Guides', 'news', 'published', now() - interval '42 days', true),
  ('IT Skills Students Should Learn Before Graduating', 'it-skills-students-should-learn', 'The practical, employer-relevant skills that consistently separate job-ready graduates from those who struggle to find their first tech role.', '<p>It''s tempting to chase whichever technology is trending, but employers consistently value a smaller set of durable skills over flashy ones.</p><p>Version control (Git) is non-negotiable — almost every professional software team uses it daily, yet many self-taught learners skip it entirely. Basic command-line comfort, understanding how the operating system you work on actually functions, and being able to read someone else''s code are similarly underrated but constantly used.</p><p>On the data side, even a working knowledge of SQL and how databases are structured will serve you regardless of which specific role you end up in — from software development to data analysis to IT support.</p><p>Communication is the most overlooked "technical" skill. Being able to explain a bug, write a clear commit message, or describe a problem to a non-technical colleague is something structured, instructor-led training environments are specifically designed to build through project work and presentations, in a way that solo online learning rarely forces you to practise.</p>', 'Career Guides', 'news', 'published', now() - interval '35 days', false),
  ('What Is Cybersecurity, and Why Does It Matter Right Now?', 'what-is-cybersecurity-and-why-it-matters', 'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.', '<p>Cybersecurity is the practice of protecting computer systems, networks and data from unauthorised access, damage or theft. As more of daily life, business and government moves online, the attack surface — every place a system could be exploited — keeps expanding, and so does the need for people who understand how to defend it.</p><p>Entry points into the field vary. Some start from a networking and systems administration background (understanding how networks are built before learning how to defend them), which is why network-focused certifications like CompTIA Network+ and CCNA are often a practical first step before specialising into security-specific certifications.</p><p>Others come from software, learning how vulnerabilities appear in code and how to test for them — the basis of ethical hacking and penetration testing, often validated by certifications such as CEH.</p><p>Whichever path you take, the fundamentals are consistent: understand how systems normally work before learning how they can be broken, and build hands-on experience in a lab environment rather than relying on theory alone.</p>', 'Technology', 'news', 'published', now() - interval '28 days', false),
  ('Data Analytics vs. Data Science: What''s the Difference?', 'data-analytics-vs-data-science', 'Two closely related fields with different day-to-day work, different tools, and different starting points for beginners.', '<p>The terms get used almost interchangeably, but the actual work differs. Data analytics is primarily about examining existing data to answer specific business questions — using tools like Excel, SQL and visualisation platforms such as Power BI or Tableau to spot patterns and report on what has already happened.</p><p>Data science goes further, often building predictive models using statistics, programming (typically Python or R) and machine learning to forecast what is likely to happen next, or to automate a decision that would otherwise require human judgement.</p><p>In practice, most people starting out benefit from learning analytics fundamentals first — spreadsheet and SQL fluency, basic statistics, and a visualisation tool — before layering on the programming and machine learning skills that data science requires. Programmes structured around a shared foundation before branching into specialisation, such as Smart Pro''s Foundation-then-specialisation model, follow this same logic deliberately.</p>', 'Technology', 'news', 'published', now() - interval '21 days', false),
  ('Study Tips for Learning to Code (That Actually Work)', 'study-tips-for-learning-to-code', 'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.', '<p>The single biggest mistake new coding students make is passively watching or reading instead of typing code themselves. Programming is a skill you build through repetition and mistakes, not one you absorb by observation — type out every example yourself, even ones that look simple.</p><p>Expect to be stuck. Getting an error message, not knowing why your code isn''t working, and spending twenty minutes on a bug that turns out to be a missing comma is completely normal, not a sign you''re bad at this. Learning to read error messages calmly and methodically is itself a skill worth practising.</p><p>Build things you actually care about as soon as the fundamentals allow it. A small project of your own choosing will teach you more, and keep you more motivated, than the tenth generic tutorial exercise.</p><p>Finally, don''t isolate yourself. Studying alongside classmates or in a cohort — asking questions out loud, explaining a concept to someone else, comparing approaches — consistently produces better outcomes than studying entirely alone, which is one of the main practical advantages of structured, instructor-led training over self-study.</p>', 'Student Guides', 'news', 'published', now() - interval '14 days', false),
  ('Short Course or Diploma? How to Choose the Right Programme Length', 'choosing-between-short-course-and-diploma', 'A short, focused course and a longer diploma programme solve different problems. Here''s how to work out which one fits your situation.', '<p>A short, focused course — a few weeks on a specific tool or skill like Advanced Excel, a specific programming language, or a particular certification track — makes sense when you already have a general direction and need one concrete, immediately-usable skill added to what you know.</p><p>A longer diploma-style programme makes more sense when you are starting from very little existing background and want a structured path that builds fundamentals first, then specialises — the kind of progression the Advanced Diploma in Software Engineering and Aptech Certified Network Specialist programmes are built around.</p><p>If you''re unsure, our own Program Finder tool on the homepage is a quick way to get a starting recommendation based on your interests and how much time you can commit, and admissions staff can talk through your specific situation in more detail.</p>', 'Student Guides', 'news', 'published', now() - interval '7 days', false)
on conflict (slug) do nothing;
