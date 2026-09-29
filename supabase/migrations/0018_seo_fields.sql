-- ============================================================================
-- APTECH Abeokuta — SEO fields & slug redirects
-- Migration 0018
--
-- Additive and idempotent: safe to run more than once, changes no existing
-- column, and the public site keeps working (it falls back to its previous
-- queries) if this migration has not been applied yet.
--
-- What it adds
--   1. courses.seo_title / seo_description / seo_noindex
--      (insights already has seo_title / seo_description from migration 0004)
--   2. insights.seo_noindex
--   3. seo_redirects — permanent redirects written automatically by the CRM
--      when a course or insight slug is changed, so the old URL keeps its
--      search rankings instead of returning 404.
--   4. Hand-written SEO title + meta description for the 12 seeded courses
--      (only where the field is still empty — never overwrites staff edits).
--
-- Permissions: no new permission keys. SEO fields are edited through the
-- existing course/insight forms, so they are governed by the same module
-- permissions (courses.edit, news.edit, events.edit) that already gate those
-- forms. Super Admin keeps full control; roles without edit access cannot
-- change them. All writes go through the service-role client in the server
-- actions, exactly like the rest of the CMS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COURSES
-- ----------------------------------------------------------------------------
alter table courses
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_noindex boolean not null default false;

alter table courses drop constraint if exists courses_seo_title_length;
alter table courses add constraint courses_seo_title_length
  check (seo_title is null or char_length(seo_title) <= 70);

alter table courses drop constraint if exists courses_seo_description_length;
alter table courses add constraint courses_seo_description_length
  check (seo_description is null or char_length(seo_description) <= 160);

-- ----------------------------------------------------------------------------
-- 2. INSIGHTS (news, blog, announcements, events)
-- ----------------------------------------------------------------------------
alter table insights
  add column if not exists seo_noindex boolean not null default false;

-- ----------------------------------------------------------------------------
-- 3. SLUG REDIRECTS
-- ----------------------------------------------------------------------------
create table if not exists seo_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null,
  to_path text not null,
  status_code smallint not null default 301,
  created_at timestamptz not null default now(),

  constraint seo_redirects_from_unique unique (from_path),
  constraint seo_redirects_status check (status_code in (301, 308)),
  -- Same-site, absolute paths only (blocks open redirects), and never a self-redirect.
  constraint seo_redirects_paths check (
    from_path like '/%' and to_path like '/%'
    and from_path not like '//%' and to_path not like '//%'
    and from_path <> to_path
  )
);

create index if not exists idx_seo_redirects_to_path on seo_redirects (to_path);

alter table seo_redirects enable row level security;

drop policy if exists "seo_redirects_select_staff" on seo_redirects;
create policy "seo_redirects_select_staff" on seo_redirects
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- 4. SEED — SEO copy for the 12 courses created by migration 0007.
--    Every sentence restates facts already in each course's own summary
--    (duration, tools, outcomes); nothing new is claimed. Titles keep one
--    clear topic per page so the pages don't compete for the same search:
--      • software engineering / programming diploma → ADSE
--      • data science, AI, software testing         → Smart Pro
--      • networking, CCNA/CompTIA, ethical hacking  → ACNS
--      • web development                            → Responsive Web Development
-- ----------------------------------------------------------------------------
update courses set
  seo_title = 'Advanced Diploma in Software Engineering | APTECH Abeokuta',
  seo_description = 'Two-year Advanced Diploma in Software Engineering at APTECH Abeokuta: programming, web, Java and .NET, mobile apps, plus Data Science, AI or IoT tracks.'
where slug = 'advanced-diploma-software-engineering' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Smart Pro: Data Science, AI & Software Testing | APTECH Abeokuta',
  seo_description = 'Smart Pro (ACNPRO) at APTECH Abeokuta: a shared foundation in Excel, Python and R, then specialise in Data Science, AI & Machine Learning or Software Testing.'
where slug = 'smart-pro' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Aptech Certified Network Specialist (ACNS) | APTECH Abeokuta',
  seo_description = 'Aptech Certified Network Specialist at APTECH Abeokuta: hardware, networking, Red Hat, Azure and ethical hacking, mapped to CompTIA, CCNA, CCNP and CEH.'
where slug = 'aptech-certified-network-specialist' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'MS Office 2019 Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'One-month MS Office 2019 course at APTECH Abeokuta covering Word, Excel, PowerPoint and Outlook for everyday office productivity and document automation.'
where slug = 'ms-office-2019-office-automation' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Web Development Training in Abeokuta | APTECH Abeokuta',
  seo_description = 'Four-month Responsive Web Development course at APTECH Abeokuta: HTML5, CSS3 and JavaScript for building responsive, mobile-friendly websites.'
where slug = 'responsive-web-development' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Advanced Excel 2019 Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'One-month Advanced Excel 2019 course at APTECH Abeokuta: advanced formulas, PivotTables, data analysis and dashboards for reporting and data-driven roles.'
where slug = 'advanced-excel-2019' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Graphics Design Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'Two-month Graphics Design course at APTECH Abeokuta: design principles plus hands-on practice with Adobe Photoshop, Illustrator and CorelDRAW.'
where slug = 'graphics-design' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Linux Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'One-month Linux course at APTECH Abeokuta: the command line, file systems, permissions and basic system administration for servers, networking and DevOps.'
where slug = 'linux' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Python & Django Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'Three-month Python (Django) course at APTECH Abeokuta: core Python programming, then building database-backed web applications with Django.'
where slug = 'python-django' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Java Programming Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'Two-month Java I & II course at APTECH Abeokuta: core Java syntax, control structures and object-oriented programming for further application development.'
where slug = 'java-i-ii' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'Windows Server Admin Course in Abeokuta | APTECH Abeokuta',
  seo_description = 'One-month Windows Server Admin course at APTECH Abeokuta: installation, Active Directory, users and groups, and core server administration for IT support roles.'
where slug = 'windows-server-admin' and seo_title is null and seo_description is null;

update courses set
  seo_title = 'SQL Server 2016 Data Management Course | APTECH Abeokuta',
  seo_description = 'Four-month Data Management course at APTECH Abeokuta: relational database design, SQL queries, stored procedures and basic administration on SQL Server 2016.'
where slug = 'data-mgt-sql-server-2016' and seo_title is null and seo_description is null;
