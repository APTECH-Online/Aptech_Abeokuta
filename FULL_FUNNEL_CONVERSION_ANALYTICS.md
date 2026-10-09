# Full-Funnel Conversion Analytics

## Delivered
- Extended the existing admissions report with visitor → inquiry → contacted → counselled → application → enrolled stages.
- Added average first-response time from the earliest recorded interaction after each lead was created, and visible overdue follow-up count.
- Added landing-page conversion reporting using `leads.attribution_landing_page`; unknown attribution remains explicit.
- Added a `campaign_spend` table and `/admin/campaign-spend` screen for authorised staff to enter actual spend by campaign/date/currency.
- Added cost per inquiry and cost per enrolment to campaign reporting only when spend is present and uses one currency.
- Added lead stage timestamp columns for future contact/counselling transitions without fabricating historical timestamps.
- Added campaign-spend navigation and report links.

## Deployment
1. Apply `supabase/migrations/0037_full_funnel_conversion_analytics.sql` after migration `0036_behaviour_based_follow_up_journeys.sql`.
2. Deploy the updated Next.js application.
3. Enter actual spend records in **Admin → Campaign spend**. Use invoices or ad-platform spend reports; do not estimate spend from clicks.
4. Review attribution coverage and make sure inquiry forms preserve `attribution_landing_page` and campaign UTMs.

## Metric notes
- Visitor totals use unique sessions in recorded `conversion_events`, so they are not a complete page-view/unique-visitor count until page-view instrumentation consistently emits events.
- Contacted and counselled counts currently reflect the lead's current status and are not historical unique stage-transition counts. The migration captures first stage timestamps going forward.
- Average first-response time uses the first recorded `interactions.created_at` at or after lead creation. It is unavailable when there are no matching interaction records.
- Cost-per metrics are shown only when spend data exists for the selected date range and has one currency. Mixed currencies are not combined.
- Historical records with missing attribution, interactions, or stage history are not inferred.
