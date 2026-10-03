-- 0023_course_crm_controls.sql
-- Moves every remaining per-course setting that was fixed in code into the CRM.
-- All columns are optional or have a default that reproduces today's behaviour,
-- so applying this changes nothing visible until staff edit a course.
--
--   admission_status  open | coming_soon | closed. Replaces the hard-coded
--                     "Applications open" line and drives the call-to-action.
--   intake_note       optional short line, e.g. an intake date staff have confirmed.
--   page_heading      optional descriptive H1 (falls back to the title).
--   related_courses   slugs of courses to link to as "Related courses".
--   related_insights  slugs of guides to link to as "Guides related to ...".
--   curriculum        optional modules/terms in a simple text format (see lib/curriculum.ts).
--   featured_home     show on the homepage "career paths" row.
--
-- Slugs in related_* are looked up against what is published at render time,
-- so an unpublished or renamed slug just disappears; it can never create a dead link.

alter table courses add column if not exists admission_status text not null default 'open';
alter table courses add column if not exists intake_note text;
alter table courses add column if not exists page_heading text;
alter table courses add column if not exists related_courses text[] not null default '{}';
alter table courses add column if not exists related_insights text[] not null default '{}';
alter table courses add column if not exists curriculum text;
alter table courses add column if not exists featured_home boolean not null default false;

alter table courses drop constraint if exists courses_admission_status_chk;
alter table courses add constraint courses_admission_status_chk
  check (admission_status in ('open', 'coming_soon', 'closed'));

alter table courses drop constraint if exists courses_controls_length_chk;
alter table courses add constraint courses_controls_length_chk check (
  (intake_note is null or char_length(intake_note) <= 200) and
  (page_heading is null or char_length(page_heading) <= 120) and
  (curriculum is null or char_length(curriculum) <= 20000) and
  cardinality(related_courses) <= 12 and cardinality(related_insights) <= 12
);

-- Seed from the editorial map that previously lived in lib/topics.ts, so the
-- 12 existing pages are unchanged on day one but are now editable in the CRM.
update courses set page_heading = 'Advanced Diploma in Software Engineering in Abeokuta', related_courses = array['responsive-web-development','java-i-ii','smart-pro']::text[], related_insights = array['how-to-become-a-software-developer-in-nigeria','choosing-between-short-course-and-diploma','study-tips-for-learning-to-code']::text[] where slug = 'advanced-diploma-software-engineering';
update courses set page_heading = 'Smart Pro Programme: Data Science, AI & Software Testing', related_courses = array['advanced-excel-2019','data-mgt-sql-server-2016','python-django']::text[], related_insights = array['data-analytics-vs-data-science','choosing-between-short-course-and-diploma']::text[] where slug = 'smart-pro';
update courses set page_heading = 'Aptech Certified Network Specialist (ACNS): Networking & Cybersecurity Programme', related_courses = array['linux','windows-server-admin']::text[], related_insights = array['what-is-cybersecurity-and-why-it-matters','choosing-between-short-course-and-diploma']::text[] where slug = 'aptech-certified-network-specialist';
update courses set page_heading = 'MS Office 2019 Training in Abeokuta', related_courses = array['advanced-excel-2019']::text[], related_insights = array['it-skills-students-should-learn','choosing-between-short-course-and-diploma']::text[] where slug = 'ms-office-2019-office-automation';
update courses set page_heading = 'Responsive Web Development Course in Abeokuta', related_courses = array['python-django','advanced-diploma-software-engineering','graphics-design']::text[], related_insights = array['how-to-become-a-software-developer-in-nigeria','study-tips-for-learning-to-code']::text[] where slug = 'responsive-web-development';
update courses set page_heading = 'Advanced Excel 2019 Course in Abeokuta', related_courses = array['ms-office-2019-office-automation','data-mgt-sql-server-2016','smart-pro']::text[], related_insights = array['data-analytics-vs-data-science','it-skills-students-should-learn']::text[] where slug = 'advanced-excel-2019';
update courses set page_heading = 'Graphics Design Course in Abeokuta', related_courses = array['responsive-web-development','ms-office-2019-office-automation']::text[], related_insights = array['choosing-between-short-course-and-diploma']::text[] where slug = 'graphics-design';
update courses set page_heading = 'Linux Course in Abeokuta', related_courses = array['aptech-certified-network-specialist','windows-server-admin','python-django']::text[], related_insights = array['what-is-cybersecurity-and-why-it-matters','it-skills-students-should-learn']::text[] where slug = 'linux';
update courses set page_heading = 'Python (Django) Course in Abeokuta', related_courses = array['data-mgt-sql-server-2016','responsive-web-development','java-i-ii']::text[], related_insights = array['how-to-become-a-software-developer-in-nigeria','study-tips-for-learning-to-code']::text[] where slug = 'python-django';
update courses set page_heading = 'Java I & II Course in Abeokuta', related_courses = array['python-django','advanced-diploma-software-engineering','data-mgt-sql-server-2016']::text[], related_insights = array['how-to-become-a-software-developer-in-nigeria','study-tips-for-learning-to-code']::text[] where slug = 'java-i-ii';
update courses set page_heading = 'Windows Server Admin Course in Abeokuta', related_courses = array['aptech-certified-network-specialist','linux']::text[], related_insights = array['what-is-cybersecurity-and-why-it-matters','it-skills-students-should-learn']::text[] where slug = 'windows-server-admin';
update courses set page_heading = 'SQL Server 2016 Data Management Course in Abeokuta', related_courses = array['python-django','advanced-excel-2019','smart-pro']::text[], related_insights = array['data-analytics-vs-data-science','it-skills-students-should-learn']::text[] where slug = 'data-mgt-sql-server-2016';

-- The three flagship programmes previously hard-coded in the homepage component.
update courses set featured_home = true
where slug in ('advanced-diploma-software-engineering', 'smart-pro', 'aptech-certified-network-specialist');
