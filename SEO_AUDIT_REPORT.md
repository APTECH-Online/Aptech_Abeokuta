# SEO Audit & Implementation Report — Aptech Abeokuta Website

Stack: Next.js 16 (App Router) + Supabase, deployed on Vercel. Audit and
implementation covered the full codebase (390 files, ~30 public routes, the
staff CRM, and 18 database migrations).

## SEO Scorecard

| Area | Status | Findings | Changes made |
| --- | --- | --- | --- |
| Metadata | ✅ Fixed | Titles/descriptions existed but were generic on several pages; every page's `openGraph` block silently dropped the shared default image (Next.js shallow-merges metadata) | New `buildMetadata()` helper (`lib/seo.ts`) used by all 14 static pages, the homepage, and both dynamic detail pages; every page now gets a unique title, description, canonical, OG and Twitter card |
| Technical SEO | ✅ Fixed | Sitemap at non-standard `/sitemap`, statically generated at build time (never updated); `public/robots.txt` conflicted with `app/robots.ts` | Standard `/sitemap.xml` (`app/sitemap.ts`), revalidated hourly and on every publish/unpublish/rename; one `robots.ts`, old static file removed; 301 from `/sitemap` → `/sitemap.xml` |
| Local SEO | ✅ Fixed | No `tel:` links anywhere; email hardcoded in 3 places instead of reading the CRM; no LocalBusiness schema, no opening hours in schema | `tel:`/`mailto:`/"Get directions" links added (Contact page, footer); LocalBusiness + EducationalOrganization schema with parsed opening hours, in `lib/structured-data.ts` |
| Structured Data | ✅ Fixed | FAQ schema emitted with an empty list; every Event given the campus address regardless of venue; JSON-LD built with raw `JSON.stringify` (unsafe if CMS text contains `</script>`) | `components/shared/JsonLd.tsx` escapes output safely; schema functions return `null` when a page doesn't qualify; Event address only applied when the venue text actually refers to the campus |
| Sitemap | ✅ Fixed | See Technical SEO | Includes real `lastmod` from the database; excludes drafts, unpublished, expired and staff-flagged noindex content; excludes reserved insight slugs |
| Robots.txt | ✅ Fixed | Conflicting static file; relative sitemap URL | Single source (`app/robots.ts`); blocks `/admin`, `/api/`; absolute sitemap URL; `X-Robots-Tag: noindex` also set on those routes as defence in depth |
| Internal Linking | ✅ Fixed | Contact page had no link into Admissions | Added a Contact → "start your application" link |
| Images | ⚠️ Partial | Alt text and `next/image` `sizes` were already good on most images; one raw `<img>` in the Insight article page bypassed `next/image` | Swapped the Insight body image to `next/image`; enabled AVIF/WebP output in `next.config.js`. Did not touch decorative-image `alt=""` usage — that was already correct |
| Performance | ⚠️ Partial | No explicit image cache headers; no AVIF/WebP | Added `formats: ['image/avif','image/webp']` and cache headers for `/images/*` in `next.config.js`. Core Web Vitals were not re-measured — see "Remaining issues" |
| Mobile SEO | ✅ No change needed | Already responsive; not part of this brief's scope beyond metadata parity | — |
| Content SEO | ✅ Fixed (metadata only) | Course/insight metadata used the same generic phrasing across similar pages | SEO title/description fields for courses (new CRM columns) and reused existing insight fields; seeded real, length-checked copy for all 12 existing courses |
| Indexation | ✅ Fixed | No way to keep a course/insight page live but out of search | `seo_noindex` column + CRM checkbox for both courses and insights; sitemap and robots both respect it |
| Accessibility | ✅ No regressions | Existing ARIA/labels were already solid | No accessibility changes were required by this brief; none were introduced |

## Files modified
- `app/layout.tsx` — site-wide metadata defaults, verification tag, `en-NG`, JSON-LD moved out to the site layout
- `app/(site)/layout.tsx` — renders the site-wide JSON-LD graph
- `app/(site)/page.tsx` — new metadata, safe FAQ schema, H1
- `app/(site)/about/page.tsx`, `contact/page.tsx`, `courses/page.tsx`, `admissions/page.tsx`, `gallery/page.tsx`, `student-life/page.tsx`, `testimonials/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `insights/page.tsx`, `insights/news/page.tsx`, `insights/blog/page.tsx`, `insights/announcements/page.tsx`, `insights/events/page.tsx` — `buildMetadata()`, safe `<JsonLd/>`, H1 edits where the heading repeated another page's or lacked topic/location
- `app/(site)/courses/[slug]/page.tsx`, `insights/[slug]/page.tsx` — CRM SEO fields, noindex, redirect lookup on 404, `next/image` swap (insight body)
- `app/robots.ts`, `next.config.js` — see Technical SEO above
- `components/footer/Footer.tsx`, `components/admissions/AdmissionsForm` context (`app/(site)/admissions/page.tsx`), `app/(site)/privacy/page.tsx` — email now sourced from `getPublicContactInfo()` instead of hardcoded
- `components/admin/CourseForm.tsx` — added the SEO section (title/description/noindex) that the actions already supported
- `app/admin/(dashboard)/courses/actions.ts`, `insights/actions.ts` — SEO field read/save, slug-change → redirect recording, reserved-slug rejection (insights), sitemap revalidation
- `app/api/cron/publish-insights/route.ts` — sitemap revalidation on auto-publish/expire
- `data/site.ts` — richer, location-specific `siteConfig.description`
- `data/courses.ts` — extended public `Course` type with SEO fields
- `types/db.ts` — SEO columns on `Course`, `seo_noindex` on `Insight`, new `SeoRedirect` type
- `lib/courses-public.ts`, `lib/insights-public.ts` — SEO fields with automatic fallback if migration hasn't run yet, plus lightweight sitemap queries
- `.env.example` — documented `NEXT_PUBLIC_SITE_URL` requirements and the new verification variable

## Files created
- `lib/seo.ts` — canonical URL, `buildMetadata()`, text helpers, phone/hours normalisation, reserved slugs, static path list
- `lib/structured-data.ts` — rewritten from scratch (see Structured Data above)
- `lib/seo-redirects.ts` — slug-change redirect bookkeeping
- `components/shared/JsonLd.tsx` — safe JSON-LD renderer
- `app/sitemap.ts` — replaces the old `app/(site)/sitemap/route.ts`
- `public/images/og-default.png` — 1200×630 default social-share image
- `supabase/migrations/0018_seo_fields.sql`
- `docs/SEO.md` — developer documentation for this system
- `SEO_AUDIT_REPORT.md` — this file

## Files removed
- `public/robots.txt` (conflicted with `app/robots.ts`)
- `app/(site)/sitemap/route.ts` (replaced by `app/sitemap.ts`)

## Database migrations required
Run `supabase/migrations/0018_seo_fields.sql`. It is additive and idempotent:
- `courses.seo_title`, `courses.seo_description` (with the same 70/160
  character CHECK constraints Insights already had), `courses.seo_noindex`
- `insights.seo_noindex`
- `seo_redirects` table (same RLS pattern as every other CRM table: active
  staff can read; all writes go through the service-role client)
- Seeds `seo_title`/`seo_description` for the 12 existing courses, only
  where those columns are still empty (never overwrites a staff edit)

No new permission keys: SEO fields are edited through the existing
course/insight forms and are governed by the same `courses.edit` /
`news.edit` / `events.edit` permissions already in place.

## New SEO/CMS fields added
`courses`: `seo_title` (≤70 chars), `seo_description` (≤160 chars),
`seo_noindex` (boolean). `insights`: `seo_noindex` (boolean) — `seo_title`
and `seo_description` already existed.

## Routes added or changed
- Added: `app/sitemap.ts` → `/sitemap.xml`
- Removed: `app/(site)/sitemap/route.ts` → `/sitemap` (now redirects)

## Redirects added
- `/sitemap` → `/sitemap.xml` (301, `next.config.js`)
- Dynamic, staff-triggered: any course/insight slug change writes a 301
  from the old `/courses/:slug` or `/insights/:slug` to the new one
  (`seo_redirects` table, checked by the `[slug]` pages)

## Schema types implemented
`EducationalOrganization` + `LocalBusiness` (site-wide, with
`OpeningHoursSpecification`), `WebSite`, `WebPage`/`AboutPage`/`ContactPage`,
`BreadcrumbList`, `FAQPage`, `Course`, `Article`/`BlogPosting`/`NewsArticle`
(picked by content type), `Event`.

## Sitemap implementation
`app/sitemap.ts`, Next's native `MetadataRoute.Sitemap` convention, served
at `/sitemap.xml`. Static pages + published courses + published,
non-expired, non-noindex insights, each with `lastmod` from real
`updated_at` values. Revalidated hourly and on every CMS publish action.

## Robots implementation
`app/robots.ts`. Allows everything except `/admin` and `/api/`; points to
the absolute sitemap URL; backed by `X-Robots-Tag: noindex` headers on the
same two path groups.

## Technical SEO issues fixed
Sitemap/robots conflicts (above); unsafe JSON-LD serialization; missing
`og:image` on every page; missing `tel:`/`mailto:` links; hardcoded contact
email drifting from the CRM's actual value; one raw `<img>` bypassing
`next/image`; no image format negotiation (AVIF/WebP); no way to noindex a
single course or insight; slug changes 404ing instead of redirecting;
insight slugs able to collide with static routes (`news`, `blog`, `events`,
`announcements`); **course/insight 404s and slug-rename redirects returning
HTTP 200 instead of 404/301** (see next section — root-caused and fixed).

### Root cause found and fixed: wrong HTTP status on 404s and redirects
Testing surfaced that `/courses/[slug]` and `/insights/[slug]` returned
HTTP 200 for both a missing slug and a renamed-slug redirect, even though
the page rendered the correct not-found UI (with its `noindex` meta tag) or
called `permanentRedirect()`. Root cause, confirmed against this Next.js
version's own bundled documentation
(`node_modules/next/dist/docs/.../file-conventions/loading.md#status-codes`):
this app has a root `app/loading.tsx`, which wraps every page in a Suspense
boundary. Once a response starts streaming — which happens the moment any
page under a `loading.tsx` begins rendering — its HTTP status is locked at
200 for the rest of that response, even if the page then calls `notFound()`
or `redirect()`. This is documented Next.js behavior, not a bug in this
codebase, but it does mean `notFound()`/`permanentRedirect()` inside a page
component can never produce a real 404/301 in an app built this way.

The documented fix is to make the decision in `proxy.ts` (this Next
version's name for middleware), before any page rendering — and therefore
before any streaming — begins:

- `proxy.ts` now intercepts `/courses/:slug` and `/insights/:slug` (via a
  new matcher entry) and runs a minimal existence check
  (`publishedCourseSlugExists` / `publishedInsightSlugExists`, added to
  `lib/courses-public.ts` / `lib/insights-public.ts` — one indexed column,
  `limit(1)`) before Next starts rendering anything.
  - Slug exists → request passes through, page renders normally (200).
  - Slug doesn't exist but a rename redirect is on file → a real HTTP 308
    redirect is returned directly by proxy, with a `Location` header — no
    page render at all.
  - Slug doesn't exist and there's no redirect → a genuine HTTP 404 is
    returned directly by proxy, with a small hand-built, on-brand HTML body
    (`staticNotFoundHtml()` in `lib/seo.ts`) and an explicit
    `X-Robots-Tag: noindex`. This has to be hand-built rather than the
    site's real not-found page: rendering the real React not-found page
    would itself start streaming and lose the 404 status, which is the
    exact problem being fixed.
  - Reserved slugs (`news`, `blog`, `events`, `announcements`) are recognised
    and skipped, since those are real static routes, not course/insight
    slugs.
  - **Fails open**: any error from the check (Supabase not configured, a
    network blip) is logged and the request passes through to the page,
    which behaves exactly as it did before this fix — an infra hiccup
    degrades to "wrong status code on a 404" rather than breaking the course
    catalogue.
- The page components' own `notFound()`/`permanentRedirect()` calls were
  left in place, deliberately, as a fallback: they still guarantee the
  correct UI and `noindex` meta tag even in the case where this proxy check
  is somehow bypassed (a cached response, a future config change) — they
  are just no longer the only thing determining the HTTP status.

**Verified against a real HTTP server** (not just a build): a minimal fake
Supabase backend was stood up locally and `next start` was pointed at it.
All six cases behaved exactly as intended — a real 200 for an existing
slug, a real 308 with the correct `Location` header for a renamed slug, a
real 404 for a genuinely missing slug, and correct bypass for the four
reserved section slugs (`/insights/news` etc., which are static pages, not
CMS-controlled slugs).

**Trade-off**: this adds one small database query on every course/insight
page request (in addition to the page's own query), to answer the request
before rendering starts. It is intentionally minimal (a single indexed
column, `limit(1)`) to keep that cost low; there was no way to get a
correct HTTP status without doing the existence check somewhere ahead of
rendering.

## Remaining issues requiring external configuration
- **`NEXT_PUBLIC_SITE_URL`** must be set to the real production domain —
  everything above resolves to `https://example.com` until it is.
- **www/https canonicalization** is a hosting/DNS setting (Vercel domain
  config), deliberately not hardcoded here to avoid a redirect loop against
  whatever the platform already does.
- **Core Web Vitals** were not re-measured (would need a live deployment and
  Lighthouse/CrUX data); only the low-risk, code-level levers (AVIF/WebP,
  image caching) were pulled.
- **Autocomplete attributes** on the Admissions/Contact form fields (e.g.
  `autoComplete="tel"`, `"email"`) were not added — a minor UX/conversion
  item, not core SEO, left out to keep this change focused.

## Recommended Google Search Console actions
1. Verify the property (HTML tag via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`,
   or a DNS TXT record — either works, no further code needed).
2. Submit `https://<domain>/sitemap.xml`.
3. Request indexing for `/`, `/courses`, `/admissions` once live.
4. Watch the Coverage and Enhancements reports after the first crawl —
   confirm `/admin` and `/api` never appear, and that the new
   Course/Event/FAQ rich results validate.
5. If the domain has ever served content at a different URL structure,
   check the old URLs' index status and add entries to `seo_redirects`
   for any that Search Console still shows as receiving traffic.

## Risks or breaking changes
- **None to existing functionality.** No form, CRM workflow, admissions
  flow, or visual design was changed. `next.config.js`'s new `redirects()`
  and `headers()` are additive.
- **Deploy-order safety**: the public course/insight queries fall back
  automatically if migration `0018` hasn't run yet (see `docs/SEO.md`), so
  deploying code before the migration will not break the public site — it
  will just serve generated (not CRM-authored) metadata until the migration
  runs.
- **`data/site.ts`'s `siteConfig.description`** was reworded to be more
  specific (still verified, no invented facts) — this string appears in the
  footer and as a schema/meta fallback, so it is now slightly more visible
  sitewide than before.
- **JSON-LD structure changed** (single organization graph with `@id`
  references instead of one Organization block per page) — this is more
  correct per Google's guidance but is a structural change search engines
  will need to re-crawl to pick up.
