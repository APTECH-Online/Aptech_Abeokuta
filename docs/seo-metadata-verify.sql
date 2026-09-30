-- ============================================================================
-- READ-ONLY check: does the SEO dashboard's "Missing custom metadata" number
-- match the database?
--
-- Run in the Supabase SQL editor. It changes nothing.
--
-- "Blank" = NULL, empty, or whitespace-only — the same rule the dashboard uses
-- (JavaScript trim()). Only PUBLISHED courses and insights are counted.
--
-- Expected after migration 0019 has been applied: total_missing = 0, and the
-- figure on /admin/reports/seo under "Missing custom metadata" is the same.
-- If it is not 0, the row listing (query 2) names every record being counted
-- and which field(s) it lacks.
-- ============================================================================

-- 1) The number the dashboard should show
select
  (select count(*) from courses  where status = 'published'
     and (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$' or coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$'))
+ (select count(*) from insights where status = 'published'
     and (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$' or coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$'))
  as total_missing;

-- 2) Exactly which records are counted, and why
select 'course' as type, title, '/courses/' || slug as path,
       (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$')       as missing_seo_title,
       (coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$') as missing_seo_description
from courses
where status = 'published'
  and (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$' or coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$')
union all
select 'insight', title, '/insights/' || slug,
       (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$'),
       (coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$')
from insights
where status = 'published'
  and (coalesce(seo_title, '') ~ '^[[:space:]\u00a0\ufeff]*$' or coalesce(seo_description, '') ~ '^[[:space:]\u00a0\ufeff]*$')
order by type, path;

-- 3) Totals for context (should satisfy: published = complete + missing)
select
  (select count(*) from courses  where status = 'published') as published_courses,
  (select count(*) from insights where status = 'published') as published_insights;
