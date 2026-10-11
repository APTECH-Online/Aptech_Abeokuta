# Events discoverability, security hardening, admin tools, tests and CI

Unzip over the project root (paths match the repo), then:

```bash
npm install            # picks up the new dev dependencies and lockfile changes
npm run check          # lint + typecheck + tests
```

## Database: apply these two migrations (in order)

| File | What it does |
| --- | --- |
| `supabase/migrations/0040_campus_event_lead_source.sql` | Adds `campus_event` to the `lead_source` enum (separate file: Postgres cannot use a new enum value in the transaction that adds it). |
| `supabase/migrations/0041_event_registration_capacity_and_leads.sql` | Allows `event` as a consent source; adds `register_for_campus_event()` (atomic, capacity-safe, creates/links the CRM lead) and `campus_event_registration_counts()` (seat counts, no personal data). Both are service-role only. |

Deploy the migrations **before** the new code: the registration API now calls `register_for_campus_event`.

## 1. Cleanup and tooling
- Deleted `public/robots.txt` (conflicted with `app/robots.ts`, which Next.js refuses to build with) and the dead `app/(site)/sitemap/route.ts` (`/sitemap` is redirected to `/sitemap.xml` by `proxy.ts`).
- `npm run lint` now works: `next lint` was removed in Next 16, so it runs ESLint directly (`eslint.config.mjs`). Pre-existing code-style findings are reported as warnings; nothing blocks.
- New scripts: `typecheck`, `test`, `test:watch`, `check`.
- **TypeScript side-by-side:** `typescript` is now an alias of `@typescript/typescript6` and `@typescript/native` provides TypeScript 7 (`tsc`). typescript-eslint cannot run on TS 7 yet. This is Microsoft's recommended setup. Because that alias has no `bin/tsc`, `next.config.js` sets `experimental.useTypeScriptCli: false` so `next build` type-checks through the compiler API. Remove both once typescript-eslint supports TS 7.1+.

## 2. Discoverability
- `/events` is in the sitemap (with `lastmod` from the newest event update).
- `Event` JSON-LD for every upcoming session, plus `BreadcrumbList` (`lib/events-structured-data.ts`). Free `Offer`, online/hybrid/in-person attendance mode, `SoldOut` when full. The private meeting link is never published.

## 3. Registration
- Capacity is enforced inside the database (row lock), so two people can never take the last place. Duplicate registrations are reported, never overwritten. A cancelled place can be re-taken.
- Every registration finds-or-creates a lead (source `campus_event`, reference `APE-YYYY-NNNNNN`), logs a timeline entry and records consent. Registrants now appear in Enquiries and the follow-up pipeline.
- Confirmation email (with the Google Calendar link; online/hybrid events include the join link). Staff get an in-app notification, and another when an event becomes full. Email needs `RESEND_API_KEY`.
- Event cards show "Only N places left" / "Fully booked"; full sessions cannot be selected in the form.
- Server-side Zod validation (`lib/event-registration.ts`), honeypot field, same-origin check, `Retry-After` on 429.

## 4. Rate limiting, Turnstile, security headers
- `lib/rate-limit.ts` is now async and uses Redis via the Upstash REST API when `UPSTASH_REDIS_REST_*` (or Vercel KV `KV_REST_API_*`) is set; otherwise (or if Redis is down) it falls back to the old in-memory counter. All call sites updated. Client IP comes from `lib/client-ip.ts` (platform headers first). Limits for the analytics endpoint (120/min) and Tech Playground (10-30/min) were raised, because a shared campus IP and a global counter would otherwise throttle normal use.
- Cloudflare Turnstile on events, contact, admissions and consultation booking (`components/shared/TurnstileWidget.tsx`, `lib/turnstile.ts`). Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`; without them the check is skipped. Not wired into the Tech Zone / Tech Playground lead forms.
- Security headers on every response (`lib/security-headers.js`): CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP. **Roll out the CSP with `CSP_REPORT_ONLY=true` first** and check the browser console. It still allows inline scripts (Next.js bootstrap and JSON-LD); a nonce-based policy is the next step.

## 5. Admin
- `/admin/events` rewritten: events table with registered/capacity and Open/Close, registration search and event filter, pagination (25/page) and CSV download.
- `/admin/events/new` and `/admin/events/[id]`: create and edit events (times entered in WAT; online events require an https link; capacity cannot be set below current registrations; unique web address; delete only when nobody has registered and only for Super Admin).
- `GET /api/admin/events/export[?event=<id>]` CSV (UTF-8 BOM, formula-injection safe, audit logged).
- Access: Super Admin everything; Admissions Officer view/create/edit/export; Content Manager only with `enquiries.view/edit/export`. The page previously let any active staff member see all registrations.

## 6. Tests and CI
- `npm test` runs 86 Vitest tests: rate limiter (memory + Redis), Turnstile, IP parsing, CSV, registration and event-form validation, WAT conversion, JSON-LD, security headers, sitemap coverage, permissions, and the full registration API route (capacity, duplicates, bots, rate limit, email failure).
- `.github/workflows/ci.yml`: install, lint, typecheck, test on every push/PR. The production build step runs only if `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SECRET_KEY` repository secrets exist (`/tech-zone` reads the database while prerendering, so a build needs a reachable project).

## Also changed
- `app/(site)/events/page.tsx` keeps the earlier fix: the server-rendered empty state uses the client `WhatsAppButton` instead of an `<a onClick>`.
- `types/db.ts`, `NotificationBell`, `NotificationsList`: new notification types `event.registered` and `event.full`.
- `.env.example`: Turnstile, Redis/KV and `CSP_REPORT_ONLY` variables.

## Not included (suggested next)
Nonce-based CSP, a per-event public page `/events/[slug]`, `.ics` download, event reminder emails, Turnstile on the Tech Zone/Playground forms.
