# APTECH Abeokuta Legacy URL Migration & 301 Audit

Audit date: 2026-09-29

## A. Framework detected

- Next.js 16.3.2
- React 19
- Next.js App Router
- Vercel deployment configuration (`vercel.json`) with Vercel Cron jobs
- URL handling: Next.js `proxy.ts`, App Router route files, and `next.config.js`
- Supabase-backed CMS for courses and insights

The application already used `proxy.ts` for genuine HTTP status handling of CMS
course/insight slugs. The migration extends that same pre-render mechanism to
the verified legacy URLs.

## B. Legacy URLs discovered

The supplied application contained no legacy `.html` links in its source,
metadata, sitemap, or structured data. The previous live site's crawled HTML
navigation provided direct evidence for these legacy URLs:

- `/index.html`
- `/about.html`
- `/courses.html`
- `/gallery.html`
- `/contact.html`

The existing application also documented `/sitemap` as the former sitemap URL.

No evidence was found in the supplied project or inspected legacy pages for
individual legacy course/article/event URL patterns such as
`/courses/<slug>.html`, `/insights/<slug>.html`, `/events/<slug>.html`,
`/news/<slug>.html`, or `/blog/<slug>.html`. Those patterns were therefore
not invented or added.

## C. Redirect map implemented

| Legacy URL | Current URL | Status |
|---|---|---:|
| `/index.html` | `/` | 301 |
| `/about.html` | `/about` | 301 |
| `/courses.html` | `/courses` | 301 |
| `/gallery.html` | `/gallery` | 301 |
| `/contact.html` | `/contact` | 301 |
| `/sitemap` | `/sitemap.xml` | 301 |

The map is explicit in `lib/legacy-redirects.ts`. It is handled in
`proxy.ts` before page rendering, avoiding Next.js `permanent: true`
redirects, which are commonly emitted as 308 responses rather than the
requested 301 status.

Query parameters are retained while the pathname is canonicalized.

## D. URLs intentionally not redirected

The supplied project contains current pages for `/admissions`, `/student-life`,
`/testimonials`, `/privacy`, and `/terms`, but no actual legacy `.html` URLs
for those pages were evidenced by the supplied source or inspected old-site
navigation. They were not added to the redirect map solely because they were
plausible names.

No blanket `*.html -> clean URL` rule was added. This prevents unrelated or
non-existent legacy URLs from being redirected to incorrect destinations.

Unknown CMS course/insight slugs continue through the application's existing
404 handling. Published slug changes continue to use the `seo_redirects`
table.

## E. Internal links

A repository-wide source scan found no internal links ending in `.html`.
Public navigation, footer, course cards, insight cards, breadcrumbs,
structured data and metadata use the current clean route structure.

The five verified legacy routes are therefore compatibility redirects only;
internal navigation does not intentionally link to them.

## F. Sitemap

`app/sitemap.ts` is retained. It generates:

- the static canonical public pages;
- published CMS course URLs under `/courses/<slug>`;
- published CMS insight URLs under `/insights/<slug>`.

Legacy URLs are not included.

`robots.txt` points directly to `/sitemap.xml`.

## G. Canonical status

The existing SEO implementation uses `buildMetadata()` and
`alternates.canonical` with clean site-relative paths. Dynamic courses and
insights use the same helper.

Canonical, Open Graph URL and JSON-LD URL generation are centralized through
`lib/seo.ts` and `getSiteUrl()`.

Production must continue to set `NEXT_PUBLIC_SITE_URL` to the exact canonical
origin.

## H. Verification

Source-level verification completed:

- All discovered legacy URLs have an explicit destination.
- All destinations correspond to current public routes or the canonical
  sitemap.
- Legacy redirects are emitted with HTTP 301 in `proxy.ts`.
- CMS slug redirects were changed from runtime 308 to 301.
- The previous `next.config.js` `/sitemap` permanent redirect was removed so
  it cannot emit a 308 that conflicts with the 301 requirement.
- No `.html` internal links remain.
- No redirect chain was introduced by the legacy map.
- Sitemap and robots implementations remain in place.

Live-site observations were also checked against the public domain. Current
clean course, gallery, contact, course-detail and insight-detail pages were
crawlable. The public `robots.txt` currently advertises the correct absolute
`sitemap.xml` URL. Live legacy `.html` responses were inconsistent across
crawler requests (some previously crawled legacy pages are now returning 404),
which indicates the deployed site state cannot be treated as proof of the new
code until this project is deployed.

A full wire-level 301 → 200 test must therefore be run against the deployment
containing this change.

Recommended deployment verification:

```bash
for path in /index.html /about.html /courses.html /gallery.html /contact.html /sitemap; do
  curl -sS -o /dev/null -D - "https://www.aptech-abeokuta.com.ng${path}"     | grep -Ei '^(HTTP/|location:)'
done
```

Each legacy URL should show `301` and a `Location` pointing directly to its
canonical URL. Then verify each `Location` returns `200`.

## I. Potential SEO issues / manual review

1. Deploy the changes before using production HTTP tests as the final
   acceptance check.
2. Confirm `NEXT_PUBLIC_SITE_URL` is exactly
   `https://www.aptech-abeokuta.com.ng` in the production Vercel environment.
3. Run a post-deploy crawl of the legacy map and all public sitemap URLs.
4. Check Google Search Console for any historical legacy URLs not represented
   by the verified old-site navigation. If Search Console exposes additional
   real legacy URLs, add only those with a legitimate current equivalent.
5. No individual legacy course/article/event redirects were invented because
   there was no reliable evidence for their former URL shapes.

## Files changed

- `proxy.ts`
- `next.config.js`
- `lib/legacy-redirects.ts` (new)
- `docs/SEO.md`

No UI, branding, course content, CMS behavior, forms, authentication, DNS,
or unrelated API functionality was changed.
