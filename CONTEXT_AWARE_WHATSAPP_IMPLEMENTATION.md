# Context-aware WhatsApp conversion

## Included
- WhatsApp CTA links now prefill a context-aware message using the current page, programme/advisor context, challenge result, or admissions/application intent.
- CRM-originated WhatsApp messages include the lead reference when available.
- WhatsApp click telemetry is written to `conversion_events` as `whatsapp_conversion_clicked`. Click metadata is anonymous and records page path/title, context type, and optional reference only; it does not link a browser click to a lead ID.
- Lead profiles include a **Record conversation outcome** form. Staff can record contacted, no answer, follow-up needed, counselling booked, application started, or application submitted, with notes.
- Outcomes are added to the existing CRM interaction timeline and audit log. Confirmed counselling/application outcomes emit explicit conversion events; they are only linked to the lead through the authenticated staff action.

## Deployment
1. Apply `supabase/migrations/0035_context_aware_whatsapp_conversion.sql` after migrations `0033` and `0034`.
2. Deploy the Next.js application.
3. Test WhatsApp links from the home/header, contact page, admissions page, advisor guide, career quiz/pathfinder, and a CRM lead profile.
4. In `/admin/leads/:id`, save test outcomes and confirm they appear in the lead timeline and in `conversion_events`.

## Analytics event names
- `whatsapp_conversion_clicked` — anonymous CTA click, context metadata only.
- `whatsapp_contact_outcome_recorded` — staff-confirmed conversation outcome linked to the lead.
- `whatsapp_progressed_to_counselling` — staff-confirmed counselling progression.
- `whatsapp_progressed_to_application` — staff-confirmed application progression.

Confirmed counselling also emits `consultation_booked`, and confirmed application submission emits `application_completed`, so existing CRM conversion and lead-scoring logic can consume those signals. The click event itself never claims a conversation happened or that a prospect converted.
