# Intelligent Lead Scoring — APTECH Abeokuta

## What changed

- Added migration `supabase/migrations/0034_intelligent_lead_scoring.sql` to persist a 0–100 lead score, a JSON list of score reasons, a recommended next action, configurable scoring rules, and configurable priority thresholds.
- Added `/admin/lead-scoring` for authorised admissions staff to enable/disable scoring signals, adjust points and repeat caps, and change High/Medium thresholds.
- Added score, priority rationale and recommended next action to `/admin/leads` and the lead profile.
- Tracks programme-page views and fee-intent clicks through the existing conversion-events pipeline. Anonymous events from the same browser session are linked to the CRM lead after a visitor submits the admissions form.
- Consultation bookings and submitted, under-review, accepted or enrolled applications contribute to scoring through server-side CRM records and database triggers; withdrawn or rejected applications do not count as active application intent.
- Added triggers to recalculate scores when linked analytics events, programme interests, interactions, bookings or application statuses change.
- Public analytics submissions cannot attach the new high-intent scoring events to an arbitrary lead ID; trusted server-side conversion flows link them after identity capture.

## Default rules

| Signal | Default points | Maximum occurrences |
|---|---:|---:|
| Programme page viewed | 5 | 5 |
| Programme selected in enquiry | 10 | 1 |
| Career discovery quiz completed | 10 | 1 |
| Fees / tuition inquiry | 20 | 1 |
| Consultation booked | 25 | 1 |
| Application submitted/completed | 50 | 1 |

Default thresholds: Medium at 20 points; High at 50 points. Scores are capped at 100. Rules are transparent and editable in the admin UI; this is prioritisation support, not a prediction of enrolment.

## Deployment

1. Apply `supabase/migrations/0034_intelligent_lead_scoring.sql` after migrations through `0033_consultation_booking.sql`.
2. Deploy the Next.js project.
3. Open `/admin/lead-scoring` as an authorised admissions user and confirm the default rules are visible.
4. Test a programme-page visit followed by an admissions enquiry in the same browser session, a fee-intent enquiry, a counselling booking, and an application status change. Verify the lead score, reasons, priority and recommended next action.

## Validation note

The project did not have `node_modules` installed in this workspace, so a full Next.js production build could not be run offline. TypeScript compiler output is dominated by missing Next.js/React package declarations. Run `npm ci` and `npm run build` in the normal development/deployment environment before release.
