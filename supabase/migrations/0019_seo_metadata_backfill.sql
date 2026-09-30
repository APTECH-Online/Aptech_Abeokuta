-- ============================================================================
-- APTECH Abeokuta — SEO metadata backfill
-- Migration 0019
--
-- Problem
--   The CRM SEO dashboard's "Missing custom metadata" metric counts courses and
--   insights that have no stored seo_title and/or seo_description. Two gaps
--   produced those rows:
--     • Migration 0004 seeded six published insights with no SEO copy, and
--       migration 0018 only wrote SEO copy for the 12 seeded courses.
--     • Migration 0018's seed only touched courses where BOTH fields were null,
--       so a course with one field set and one blank was never completed.
--   In addition, the CRM forms treated both fields as optional and stored blanks
--   as NULL, so any course/insight saved without them re-created the gap. (The
--   server actions now fill blanks on save — see resolveSeoFields in lib/seo.ts.)
--
-- What this migration does
--   Fills ONLY blank (NULL / empty / whitespace-only) seo_title and
--   seo_description values, field by field:
--     1. The six seeded insights get hand-written copy that restates their own
--        title and short description (nothing new is claimed).
--     2. Every other course/insight with a blank field gets a value generated
--        from its own content, using the same rules as lib/seo.ts
--        (generateSeoTitle / generateSeoDescription): titles ≤ 65 characters,
--        descriptions ≤ 160.
--   Rows are matched regardless of status so a draft cannot later be published
--   with a blank field.
--
-- Safety
--   • Additive and idempotent: safe to run more than once.
--   • No schema change, no deletes, no overwriting of any existing SEO text.
--   • updated_at is preserved: the two updated_at triggers are paused for the
--     backfill and restored, so "Review due" (staleness) and sitemap <lastmod>
--     are not reset on rows nobody actually edited. Everything runs inside this
--     migration's transaction, so a failure restores the triggers too.
--   • Helper functions live in pg_temp and disappear at the end of the session.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Temporary helpers (mirror the pure functions in lib/seo.ts)
-- ----------------------------------------------------------------------------

-- isBlank(text): NULL, empty, or whitespace-only. Matches JavaScript's trim()
-- (which the CRM and dashboard use), NOT btrim(), which only strips spaces and
-- would leave a value like E'\n\t' looking "filled in".
create or replace function pg_temp.seo_blank(txt text)
returns boolean language sql immutable as $$
  select coalesce(txt, '') ~ '^[[:space:]\u00a0\ufeff]*$';
$$;

-- truncate(text, max): collapse whitespace; if too long cut at a word boundary
-- (only when that boundary is past 60% of max), strip trailing punctuation,
-- append an ellipsis.
create or replace function pg_temp.seo_truncate(txt text, max_len int)
returns text language plpgsql immutable as $$
declare
  clean text := btrim(regexp_replace(coalesce(txt, ''), '\s+', ' ', 'g'));
  cut text;
  pos int;
  idx int;
begin
  if char_length(clean) <= max_len then
    return clean;
  end if;
  cut := left(clean, max_len - 1);
  pos := position(' ' in reverse(cut));
  idx := case when pos > 0 then char_length(cut) - pos else -1 end; -- 0-based index of last space
  if idx > max_len * 0.6 then
    cut := left(cut, idx);
  end if;
  cut := regexp_replace(cut, '[[:space:],;:.–—-]+$', '');
  return cut || '…';
end;
$$;

-- stripHtml(html): plain text from an HTML body.
create or replace function pg_temp.seo_strip_html(html text)
returns text language plpgsql immutable as $$
declare
  t text := coalesce(html, '');
begin
  t := regexp_replace(t, '<(script|style)[\s\S]*?</\1>', ' ', 'gi');
  t := regexp_replace(t, '<[^>]+>', ' ', 'g');
  t := replace(t, '&nbsp;', ' ');
  t := replace(t, '&amp;', '&');
  t := replace(t, '&lt;', '<');
  t := replace(t, '&gt;', '>');
  t := replace(t, '&quot;', '"');
  t := replace(t, '&#39;', '''');
  return btrim(regexp_replace(t, '\s+', ' ', 'g'));
end;
$$;

-- generateSeoTitle(kind, title)
create or replace function pg_temp.seo_gen_title(kind text, raw_title text)
returns text language plpgsql immutable as $$
declare
  t text := btrim(regexp_replace(coalesce(raw_title, ''), '\s+', ' ', 'g'));
  brand constant text := 'APTECH Abeokuta';
  c1 text;
  c2 text;
  c3 text;
  picked text;
begin
  if kind = 'course' then
    c1 := t || ' Course in Abeokuta | ' || brand;
    c2 := t || ' in Abeokuta | ' || brand;
    c3 := t || ' | ' || brand;
    picked := case
      when char_length(c1) <= 65 then c1
      when char_length(c2) <= 65 then c2
      when char_length(c3) <= 65 then c3
      else t
    end;
  else
    c1 := t || ' | ' || brand;
    picked := case when char_length(c1) <= 65 then c1 else t end;
  end if;
  return pg_temp.seo_truncate(picked, 65);
end;
$$;

-- generateSeoDescription({ title, summary, contentHtml })
create or replace function pg_temp.seo_gen_description(summary text, content_html text, raw_title text)
returns text language sql immutable as $$
  select pg_temp.seo_truncate(
    coalesce(
      case when pg_temp.seo_blank(summary) then null else btrim(summary, E' \t\r\n') end,
      nullif(pg_temp.seo_strip_html(content_html), ''),
      btrim(raw_title) || ' at APTECH Abeokuta.'
    ),
    160
  );
$$;

-- ----------------------------------------------------------------------------
-- Keep updated_at untouched for this backfill.
-- ----------------------------------------------------------------------------
alter table insights disable trigger trg_insights_updated_at;
alter table courses  disable trigger trg_courses_updated_at;

-- ----------------------------------------------------------------------------
-- 1. The six seeded insights — hand-written copy (blank fields only).
--    Each line restates that article's own title / short description.
-- ----------------------------------------------------------------------------
update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'How to Become a Software Developer in Nigeria | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'A practical look at the skills, learning path and portfolio work that matter for landing a software development role in Nigeria today.' else seo_description end
where slug = 'how-to-become-a-software-developer-in-nigeria'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'IT Skills Students Should Learn | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'The practical, employer-relevant IT skills that separate job-ready graduates from those who struggle to find their first tech role.' else seo_description end
where slug = 'it-skills-students-should-learn'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'What Is Cybersecurity and Why It Matters | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.' else seo_description end
where slug = 'what-is-cybersecurity-and-why-it-matters'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'Data Analytics vs Data Science | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'Data analytics and data science are closely related but differ in day-to-day work, tools and starting points for beginners.' else seo_description end
where slug = 'data-analytics-vs-data-science'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'Study Tips for Learning to Code | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.' else seo_description end
where slug = 'study-tips-for-learning-to-code'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

update insights set
  seo_title = case when pg_temp.seo_blank(seo_title) then
    'Short Course or Diploma: How to Choose | APTECH Abeokuta' else seo_title end,
  seo_description = case when pg_temp.seo_blank(seo_description) then
    'A short, focused course and a longer diploma programme solve different problems. How to work out which one fits your situation.' else seo_description end
where slug = 'choosing-between-short-course-and-diploma'
  and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description));

-- ----------------------------------------------------------------------------
-- 2. Everything else still blank (existing courses/insights of any status) —
--    generated from the record's own content, field by field.
-- ----------------------------------------------------------------------------
update courses set
  seo_title = case
    when pg_temp.seo_blank(seo_title) then pg_temp.seo_gen_title('course', title)
    else seo_title
  end,
  seo_description = case
    when pg_temp.seo_blank(seo_description) then pg_temp.seo_gen_description(summary, null, title)
    else seo_description
  end
where pg_temp.seo_blank(seo_title)
   or pg_temp.seo_blank(seo_description);

update insights set
  seo_title = case
    when pg_temp.seo_blank(seo_title) then pg_temp.seo_gen_title('insight', title)
    else seo_title
  end,
  seo_description = case
    when pg_temp.seo_blank(seo_description) then pg_temp.seo_gen_description(short_description, content, title)
    else seo_description
  end
where pg_temp.seo_blank(seo_title)
   or pg_temp.seo_blank(seo_description);

alter table insights enable trigger trg_insights_updated_at;
alter table courses  enable trigger trg_courses_updated_at;

-- ----------------------------------------------------------------------------
-- 3. Self-check: report (never fail on) anything still incomplete.
-- ----------------------------------------------------------------------------
do $$
declare
  remaining int;
begin
  select
    (select count(*) from courses  where status = 'published'
       and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description)))
  + (select count(*) from insights where status = 'published'
       and (pg_temp.seo_blank(seo_title) or pg_temp.seo_blank(seo_description)))
  into remaining;
  raise notice '0019_seo_metadata_backfill: % published course/insight row(s) still missing SEO metadata', remaining;
end
$$;
