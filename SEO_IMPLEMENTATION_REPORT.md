# APTECH Abeokuta — SEO Implementation Report

Audit/update date: 2026-09-29

## Implemented in this update

1. **Canonical production origin hardened**
   - Canonical, sitemap, robots and JSON-LD URLs now use the verified production origin:
     `https://www.aptech-abeokuta.com.ng`
   - Vercel preview/project hostnames can no longer accidentally become SEO canonical URLs.

2. **Admissions FAQ structured data added**
   - The published admissions FAQs already visible on `/admissions` are now emitted as `FAQPage` JSON-LD when available.
   - No FAQ data is invented; the schema uses the same CMS-backed questions/answers rendered on the page.

3. **Event structured data made more conservative**
   - `OfflineEventAttendanceMode` is emitted only when a real venue is present.
   - Events without a venue no longer get an inferred offline attendance mode.

4. **Legacy 301 migration retained**
   - Verified legacy redirects remain explicit in `lib/legacy-redirects.ts` and are emitted from `proxy.ts` as HTTP 301 responses.
   - No blanket `.html` redirect was introduced.

5. **Next.js 16 matcher fix retained**
   - `proxy.ts` uses a statically analyzable matcher array, avoiding the Vercel/Turbopack build error caused by a dynamically spread matcher.

## Already correct and preserved

- Next.js 16 App Router architecture.
- Existing UI, branding, routes, CMS, forms and authentication.
- Dynamic course and insight metadata.
- Clean canonical URLs.
- `/sitemap.xml` dynamic sitemap.
- `/robots.txt` with the canonical sitemap reference.
- Course, article, event and breadcrumb JSON-LD.
- Safe JSON-LD serialization.
- CMS SEO fields and `seo_noindex` support.
- Sitemap filtering for `seo_noindex` content.
- Custom 404 UI and pre-render 404 handling for unknown CMS slugs.
- CMS slug-change 301 redirects with chain flattening.
- No internal `.html` links.

## Verified legacy redirect map

| Legacy URL | Canonical destination | Status |
|---|---|---:|
| `/index.html` | `/` | 301 |
| `/about.html` | `/about` | 301 |
| `/courses.html` | `/courses` | 301 |
| `/gallery.html` | `/gallery` | 301 |
| `/contact.html` | `/contact` | 301 |
| `/sitemap` | `/sitemap.xml` | 301 |

No additional historical course/article/event `.html` URLs were invented because the project/legacy evidence did not establish them.

## Validation status

The user has completed live **301 → final 200** testing after deployment. This report therefore treats the legacy migration as live-verified by the deployment owner rather than claiming a sandbox HTTP test that was not run from this environment.

The local archive cannot run `next build` because the bundled `node_modules` does not contain the executable binaries and dependency installation in the sandbox timed out. The previously reported Next.js matcher compilation defect has nevertheless been removed: the matcher is now an explicit static array.

## External/manual follow-up

- Continue monitoring Google Search Console for historical URLs not represented by the verified legacy map.
- Confirm Vercel's production domain remains `https://www.aptech-abeokuta.com.ng`.
- Apply database migration `0018_seo_fields.sql` if it has not already been applied in production.
- Monitor sitemap coverage, canonical indexing and excluded legacy URLs after Google recrawls the migration.
