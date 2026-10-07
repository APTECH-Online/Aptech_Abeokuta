# APTECH Abeokuta — Phase 3 Admissions & Sales Analytics Implementation Report

## Scope

Phase 3 extends the existing admissions CRM into an analytics/reporting layer. It does not introduce a second lead, application, or enrollment system.

## Audit findings

- Existing `leads` table remains the lead source of truth.
- Existing `lead_interests` relationships are used for programme demand and programme attribution.
- Existing `applications` remain the application source of truth and preserve `lead_id`.
- Existing lead status `enrolled` and application status `enrolled` remain the enrollment relationship.
- Existing `follow_ups` and `interactions` are reused for follow-up and operational analytics.
- Phase 1 `interactive_quiz_results` is reused for Career Quiz attribution.
- Existing role/permission infrastructure is reused; no parallel authorization model was added.
- There was no reliable enrollment event timestamp. Phase 3 therefore adds `applications.enrolled_at` to the existing application record and backfills existing enrolled applications from their best-known `updated_at` timestamp. Future enrollment transitions receive a real event timestamp.
- Phase 1 start/completion/recommendation telemetry was not persistently stored. Phase 3 adds one lightweight `conversion_events` table for those specific interaction events only; lead/application/enrollment counts still come from CRM relationships.
- Lost reasons were not present as structured lead data, so `leads.lost_reason` was added to the existing lead profile rather than creating a separate loss table.

## Implemented

### Executive dashboard
- Added a compact admissions/sales overview to the existing `/admin` dashboard.
- Added Total Leads, New Leads, Contacted, Interested, Applications, Enrolled, Lead→Enrollment, Lead→Application, follow-up and overdue indicators.
- Added direct navigation to full analytics.

### Analytics page
- Expanded `/admin/reports` into the main Admissions & Sales Analytics page.
- Date ranges: Today, Last 7 days, Last 30 days, This month, Last month, This quarter, This year, Custom.
- Lead funnel with counts, previous-stage percentages, and overall percentages.
- Lead→Enrollment, Lead→Application, Application→Enrollment metrics.
- Source performance using existing lead sources.
- Programme performance and most-requested programme ranking from database relationships.
- Current lead-status distribution.
- Follow-up overview: due today, completed today, upcoming, overdue, without follow-up, without recent activity, completion rate.
- Staff operational performance without a gamified leaderboard.
- Lost-lead reason reporting using only recorded reasons.
- Conversion trends for Leads, Applications and Enrollments.
- Source vs Programme attribution where relationships exist.
- Career Quiz and Tech IQ Challenge starts, completions, completion rate, leads, applications and enrollments.
- Empty states avoid fabricated metrics.

### Attribution and date rules
- Leads: `leads.created_at`.
- Applications: `applications.created_at`.
- Enrollments: `applications.enrolled_at`.
- Follow-ups: due/completion timestamps according to the metric.
- Source attribution continues through `Lead → Application → Enrollment`.

### Exports
Authorized staff can export aggregated CSV reports for lead/source, programme, application conversion and enrollment conversion without exporting unnecessary personal data.

### Permissions
- Super Admin: full analytics.
- Admissions Officer: operational analytics scoped to assigned leads/applications/follow-ups.
- Content Manager: analytics only when explicit dashboard admissions/report permissions and the relevant CRM view permissions are granted.
- Existing permission functions and staff roles are reused.

## Files added/changed

- `lib/crm/analytics.ts`
- `lib/conversion-events.ts`
- `app/api/analytics/events/route.ts`
- `app/api/admin/reports/export/route.ts`
- `app/admin/(dashboard)/reports/page.tsx`
- `app/admin/(dashboard)/page.tsx`
- `app/admin/(dashboard)/leads/[id]/actions.ts`
- `components/admin/AdminShell.tsx`
- `components/admin/LeadActionForms.tsx`
- `components/admin/charts.tsx`
- `components/home/ProgramFinder.tsx`
- `components/home/TechChallenge.tsx`
- `app/(site)/admissions/quiz-actions.ts`
- `types/db.ts`
- `supabase/migrations/0027_admissions_sales_analytics.sql`

## Verification

The extracted Phase 2 package was used as the implementation baseline. The environment could not complete `npm ci` within the sandbox timeout, so a full dependency-backed `next build` could not be completed locally. The package was still checked structurally, and the implementation avoids new runtime dependencies.

Vercel should run the normal production build after applying migration `0027_admissions_sales_analytics.sql` to Supabase.
