-- 0022_course_detail_fields.sql
-- Three optional, staff-written fields per course. They answer questions
-- prospective learners and search engines ask that the original schema had no
-- room for. All nullable: a page shows a section only when staff have filled
-- it in, so no course ever displays a guessed or placeholder claim.
--
--   audience       who the course is for
--   prerequisites  entry requirements, in plain text
--   certification  what certificate/assessment (if any) is awarded
--
-- Run this BEFORE deploying the matching code if you want the fields in the CRM
-- immediately. The public site tolerates the columns being absent (it falls
-- back to the previous column set), and the CRM only writes them when used.

alter table courses add column if not exists audience text;
alter table courses add column if not exists prerequisites text;
alter table courses add column if not exists certification text;

alter table courses drop constraint if exists courses_detail_length_chk;
alter table courses add constraint courses_detail_length_chk check (
  (audience is null or char_length(audience) <= 800) and
  (prerequisites is null or char_length(prerequisites) <= 800) and
  (certification is null or char_length(certification) <= 800)
);
