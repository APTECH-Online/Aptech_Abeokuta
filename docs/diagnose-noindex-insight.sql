-- Run in the Supabase SQL editor. Lists every insight that is "published" in the
-- CRM and states, per row, whether and why Google can or cannot index it.
-- The 7th published insight will show up with one or more of the flags below.
select
  slug,
  content_type,
  category,
  status,
  seo_noindex                                   as staff_ticked_noindex,   -- explicit CRM checkbox (default false)
  (publish_at is null or publish_at > now())    as not_live_yet,           -- scheduled: hidden by lib/insights-public.ts
  (expires_at is not null and expires_at <= now()) as expired,             -- expired: hidden
  (slug in ('news','blog','events','announcements')) as reserved_slug,     -- shadowed by a static route
  case
    when status <> 'published'                                  then 'not published'
    when seo_noindex                                            then 'INTENTIONAL: staff ticked "Hide from search engines"'
    when publish_at is null or publish_at > now()               then 'scheduled - not live yet'
    when expires_at is not null and expires_at <= now()         then 'expired - not live'
    when slug in ('news','blog','events','announcements')       then 'reserved slug - page unreachable'
    else 'indexable'
  end                                           as why,
  updated_at
from insights
where status = 'published'
order by (seo_noindex) desc, updated_at desc;
