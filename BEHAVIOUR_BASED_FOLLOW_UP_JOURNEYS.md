# Behaviour-Based Follow-Up Journeys

## Included
- Supabase migration `0036_behaviour_based_follow_up_journeys.sql` creates journey definitions and an auditable per-lead queue.
- Five seeded journeys: abandoned application, fee inquiry without counselling, completed Tech Zone challenge without guidance, counselling attended without application, and unanswered inquiry.
- Admin dashboard at `/admin/follow-up-journeys`, linked in the CRM navigation, with journey trigger/channel/delay, message preview, queue counts, and consent guardrails.
- Queue statuses support queued, sent, completed, paused, suppressed, and cancelled.
- Unique `(journey_id, lead_id)` constraint prevents duplicate enrolment for the same journey.

## Deployment
1. Apply `supabase/migrations/0036_behaviour_based_follow_up_journeys.sql` in the Supabase SQL editor or through the project's migration workflow.
2. Deploy the updated Next.js site.
3. Before enabling automatic sending, implement a server-side scheduled worker that detects each trigger from authoritative application, booking, lead, and challenge data; checks current marketing consent, opt-out state and communication preference immediately before delivery; writes suppression/send audit outcomes; and connects to the chosen email/WhatsApp provider.

## Important safety behaviour
This change does not send messages directly. The dashboard explicitly says so. Do not treat a challenge's `consented_to_follow_up` field as blanket consent for all channels; use the lead's current consent records and preferences, and suppress if the preference is `none` or consent is absent/withdrawn. Unanswered enquiries are staff tasks, not an automatic prospect message.
