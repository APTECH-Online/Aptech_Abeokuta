# APTECH Abeokuta — Insights & Events CMS

Extends the CRM in `docs/CRM_SETUP.md` with a content-management module for
the public `/insights` section: news, announcements, events, academic
updates, spotlights, achievements, career updates and celebrations.

Nothing about the existing CRM modules, authentication, or unrelated public
pages changed. `/insights` and `/insights/[slug]` keep their existing URLs
and design — they now read from Supabase instead of `data/insights.ts`.

## 1. Run the migration

In the Supabase SQL editor (or `supabase db push`), run
`supabase/migrations/0004_insights.sql` after the existing 0001–0003
migrations. It's additive only:

- Adds the `insights` table, its enums, indexes and RLS policy.
- Adds a `can_manage_insights` boolean to the existing `staff` table.
- Creates a public `insights` Storage bucket for featured images.
- Seeds the six existing static articles from `data/insights.ts` so their
  URLs (`/insights/<slug>`) keep working (skipped automatically if a slug
  already exists — safe to re-run).

## 2. Grant Content Manager access

There is no new `staff_role` value. Instead, any staff member can be
granted (or revoked) Insights access independently of their role, from
**Staff → Insights access** (Super Admins only) — see
`toggleInsightsPermission` in `app/admin/(dashboard)/staff/actions.ts`.
Super Admins always have access. This keeps Insights permissions from
accidentally widening access to leads, applications, or staff management,
which several of the existing role-based checks in `lib/auth.ts` are not
scoped to exclude.

## 3. Environment variables

One addition to the table in `docs/CRM_SETUP.md`:

| Variable | Required | Notes |
|---|---|---|
| `CRON_SECRET` | Yes, for scheduling | Shared secret for `/api/cron/publish-insights`. Vercel Cron sends this automatically as `Authorization: Bearer <value>` once the env var is set — see `vercel.json`. |

## 4. Scheduled publishing

`app/api/cron/publish-insights/route.ts` is triggered every 5 minutes by
Vercel Cron (`vercel.json`). Each run:

1. Publishes `scheduled` insights whose `publish_at` has passed.
2. Archives `published` insights whose `expires_at` has passed.

It's a plain authenticated route handler — no Celery/Redis/queue
infrastructure, consistent with the rest of this Next.js/Supabase/Vercel
app. Safe to run repeatedly or concurrently: both steps are conditional
`UPDATE`s that simply match zero rows once handled.

If you're not deploying to Vercel, call this route on a schedule from
whatever scheduler you do use, with the same `Authorization: Bearer
$CRON_SECRET` header.

## 5. Data model

See `supabase/migrations/0004_insights.sql` for the schema and
`types/db.ts` for the matching TypeScript types (`Insight`,
`InsightStatus`, `InsightContentType`). Events are a `content_type` on the
same table, not a separate table — see the `event_*` columns.
