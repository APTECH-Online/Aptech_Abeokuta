# SEO implementation

This documents what the SEO system in this codebase is, where it lives, and
what a developer or content manager needs to do to keep it correct.

## Required setup

1. **Canonical production origin** — SEO URLs are pinned in `lib/seo.ts` to
   `https://www.aptech-abeokuta.com.ng`. This prevents a Vercel preview or
   project hostname from becoming the canonical/sitemap/JSON-LD origin.
   `NEXT_PUBLIC_SITE_URL` is no longer used to select the canonical origin.
2. **Apply migration `0018_seo_fields.sql`** before deploying the admin
   changes in this release. The public site works either way (see
   "Deploy-order safety" below), but the SEO fields in the CRM forms won't
   save until the columns exist.
3. **`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`** (optional) — the token from
   Search Console's "HTML tag" verification method. Leave unset to render no
   verification tag, or verify via a DNS TXT record instead (no code needed
   either way).
4. **www vs non-www, http vs https** — keep Vercel's production domain
   configuration aligned with `https://www.aptech-abeokuta.com.ng`. Canonical
   SEO output is pinned to that exact origin in code.

## Where things live

| Concern | File |
| --- | --- |
| Canonical site URL, metadata builder, text helpers | `lib/seo.ts` |
| JSON-LD (Organization, Course, Article, Event, FAQ, Breadcrumb, WebPage) | `lib/structured-data.ts` |
| Safe JSON-LD rendering (escapes `<`) | `components/shared/JsonLd.tsx` |
| Slug-change → permanent redirect bookkeeping | `lib/seo-redirects.ts` |
| Sitemap (`/sitemap.xml`) | `app/sitemap.ts` |
| Robots (`/robots.txt`) | `app/robots.ts` |
| Site-wide `<head>` defaults, verification tag | `app/layout.tsx` |
| Per-page metadata (14 static pages + home) | each page's own `export const metadata = buildMetadata({...})` |
| Course/Insight metadata (dynamic) | `app/(site)/courses/[slug]/page.tsx`, `app/(site)/insights/[slug]/page.tsx` |
| SEO fields in the CRM | `components/admin/CourseForm.tsx`, `components/admin/InsightForm.tsx` |
| Default social-share image | `public/images/og-default.png` (1200×630) |
| Redirect / noindex headers | `proxy.ts` (HTTP 301 legacy/CMS redirects), `next.config.js` (`headers()`) |

## How a public page gets its metadata

Every static page does:

```ts
export const metadata = buildMetadata({
  title: 'Page Title | APTECH Abeokuta',
  description: 'One or two sentences, unique to this page.',
  path: '/the-page-path'
})
```

`buildMetadata()` (in `lib/seo.ts`) fills in the canonical link, Open Graph
(with the default 1200×630 image unless you pass one), Twitter/X card, and
`noindex` when asked. This guarantees every page has all of: `<title>`,
meta description, canonical, `og:*`, and `twitter:*` — the earlier code had
pages that silently lost `og:image` because Next.js shallow-merges metadata
objects and a page-level `openGraph` block replaces the layout's, image and
all.

Courses and Insights use `generateMetadata()` instead (they need to read the
database first) but call the same `buildMetadata()` helper, and prefer the
CRM's `seo_title` / `seo_description` fields when staff have filled them in.

## Structured data

`lib/structured-data.ts` follows a few rules, enforced by code review, not
by a validator:

- Never invent data. No fake ratings, prices, reviews or hours — schema is
  built only from fields the page also displays.
- One canonical `EducationalOrganization`/`LocalBusiness` node (with a
  `@id`), rendered once in `app/(site)/layout.tsx`. Every other schema type
  that needs "who publishes this" references that `@id` instead of
  repeating the organization's details.
- Functions that don't apply return `null` (e.g. `eventJsonLd` without a
  start date, `faqJsonLd` with an empty list) — `<JsonLd data={...}/>`
  quietly skips `null`/`undefined`, so a page never emits invalid schema.
- Contact details (phone, address, hours) all come from `contact_info` in
  the CRM through `getPublicContactInfo()` — the same source the footer and
  Contact page use — so structured data can never disagree with the visible
  page.

## Why proxy.ts checks course/insight slugs

`proxy.ts` intercepts `/courses/:slug` and `/insights/:slug` and can answer
the request itself — pass-through, a 308 redirect, or a 404 — before Next
starts rendering the page. This exists because of how this app is built:
`app/loading.tsx` wraps every route in a Suspense boundary, so every page
response streams, and Next.js locks the HTTP status at 200 once a response
starts streaming (documented at
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`,
under "Status Codes"). That means a page's own `notFound()` or
`redirect()`/`permanentRedirect()` call still renders the right UI and a
`noindex` meta tag, but can never change the actual HTTP status — it's
already 200 on the wire by the time the page runs. The fix has to live
somewhere that runs before rendering begins, which is what `proxy` is for.

The check is intentionally minimal — `publishedCourseSlugExists()` /
`publishedInsightSlugExists()` in `lib/courses-public.ts` /
`lib/insights-public.ts` select one indexed column with `limit(1)` — since
it runs on every matching request. Any error (Supabase misconfigured, a
network blip) fails open: the request is passed through to the page exactly
as it would have behaved without this check. The page components' own
`notFound()`/`permanentRedirect()` logic is kept as a fallback for the rare
case this check is bypassed (a cached response, a future proxy change) —
it's just no longer the sole source of truth for the HTTP status.

If you add another CMS-backed `/[slug]` route in the future, follow the
same pattern: add an existence check to that domain's public data file,
extend `proxy.ts`'s matcher and slug regex, and reuse `findSlugRedirect` /
`recordSlugChange` for renames.


## Legacy URL migration

The explicit legacy map lives in `lib/legacy-redirects.ts`. It contains only
routes evidenced by the previous APTECH Abeokuta site's HTML navigation or by
the existing application's documented migration:

- `/index.html` → `/`
- `/about.html` → `/about`
- `/courses.html` → `/courses`
- `/gallery.html` → `/gallery`
- `/contact.html` → `/contact`
- `/sitemap` → `/sitemap.xml`

These redirects are emitted in `proxy.ts` as HTTP **301** responses before
Next.js renders a page. Query parameters are preserved. The map is explicit
rather than a blanket `*.html` rule so unrelated or fabricated URLs cannot be
redirected to an incorrect destination.

CMS slug-change redirects are also emitted as HTTP 301 responses and remain
flattened by `recordSlugChange()`, preventing redirect chains.

No legacy individual course/article/event URL was added without evidence of an
actual old URL. The previous site's crawled navigation linked the course
catalogue as `/courses.html`; it did not expose evidence of separate legacy
course/article/event URL patterns in the supplied project or the inspected
legacy pages.

## Slug redirects

When a course or insight's URL slug is changed in the CRM, the update action
calls `recordSlugChange()` (`lib/seo-redirects.ts`), which writes a row into
the `seo_redirects` table pointing the old path at the new one. The
`[slug]` pages check that table (only on a miss, so there's no per-request
cost on the happy path) and issue a permanent (301) redirect instead of a
404. Chains are flattened automatically: if `/courses/a` → `/courses/b` and
someone later renames `b` to `c`, the stored redirect is rewritten straight
to `/courses/c` rather than chaining through `b`.

Insight slugs cannot be set to `news`, `blog`, `events` or `announcements`
(`RESERVED_INSIGHT_SLUGS` in `lib/seo.ts`) — those are the static section
routes, and an insight with one of those slugs would be unreachable.

## Deploy-order safety

The public course/insight queries (`lib/courses-public.ts`,
`lib/insights-public.ts`) select the new `seo_title` / `seo_description` /
`seo_noindex` columns, then retry without them if the database reports an
"undefined column" error. This means deploying this code before running
migration `0018_seo_fields.sql` will not break the public site — courses and
insights will render with generated (not CRM-authored) metadata until the
migration runs, then automatically start using the CRM fields once it does.

## Sitemap freshness

`/sitemap.xml` (`app/sitemap.ts`) is revalidated on a schedule (hourly) and
on demand: the course/insight create/update/publish/unpublish/delete actions
and the scheduled-publish cron job all call
`revalidatePath('/sitemap.xml')`, the same pattern the codebase already used
for `revalidatePath('/courses')` etc. A newly published page appears in the
sitemap immediately, not up to an hour later.

## What is intentionally NOT automated

- **www/https redirects** — set at the DNS/hosting layer, not in
  `next.config.js`, to avoid a code-level redirect fighting a
  platform-level one and causing a loop.
- **Search Console verification and submission** — see the audit report's
  "Recommended Search Console actions".
- **Rewriting existing page copy wholesale** — per the brief, only metadata,
  structured data, technical SEO and a handful of missing links (Contact →
  Admissions, `tel:`/`mailto:`/directions links) were added. No course
  description, FAQ answer or existing heading text was rewritten.
