# Admissions Counselling Booking — Implementation Notes

## Included

- Public, responsive three-step booking flow at `/book-consultation`.
- Appointment formats: campus visit, phone call, and virtual meeting.
- Active programme selection using the existing public admissions programme loader.
- Live slot availability endpoint at `/api/admissions/availability`, with weekday slots in Africa/Lagos (WAT).
- Server-side validation, rate limiting, a honeypot, and a database unique index to prevent double-booking.
- Booking reference and secure, token-based management link; visitors can cancel or reschedule by cancelling and choosing a new slot.
- Existing CRM integration: a booking links to a lead with the same email when possible, otherwise creates an `advisor_request` lead and links it to the booking.
- Admin schedule at `/admin/bookings`, including totals, a seven-day booking overview, programme/format details, status updates, and counsellor assignment.
- Email confirmation and optional admissions inbox notification through the existing email abstraction.
- Vercel Cron reminder route at `/api/cron/consultation-reminders` for reminders approximately 24 hours before appointments.
- New migration: `supabase/migrations/0033_consultation_booking.sql`.

## Deployment steps

1. Apply `supabase/migrations/0033_consultation_booking.sql` to the same Supabase project used by this site. Existing migrations and CRM tables must already be applied.
2. Confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` are configured in Vercel. The service-role/secret key must remain server-only.
3. Set `CRON_SECRET` in Vercel so the reminder endpoint can be called by Vercel Cron.
4. For actual email delivery, configure `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`. Set `ADMISSIONS_NOTIFICATION_EMAIL` to the admissions team's inbox to receive new-booking alerts. Without a provider, the existing email service logs messages instead of delivering them.
5. Deploy the updated project and test a booking from `/book-consultation`, confirm it appears in `/admin/bookings`, update its status, test cancellation from the management link, and verify the reminder cron in Vercel logs.

## Operational details

- Appointment availability is Monday–Friday, 09:00–15:30, in 30-minute increments; all times are WAT (`Africa/Lagos`).
- A confirmed appointment holds its date/time slot. Cancelling it releases the slot.
- Rescheduling is currently a secure cancel-and-rebook flow, which avoids moving a booking into a slot that another visitor has already taken.
- The reminder job runs every 15 minutes and sends one reminder when a confirmed booking is approximately 24 hours away. The Vercel Cron route requires `Authorization: Bearer $CRON_SECRET`.
- Build validation could not be completed in this environment because npm package downloads failed with registry DNS errors (`EAI_AGAIN`). TypeScript syntax transpilation and relative-import checks passed for the changed application files; run `npm ci` and `npm run build` in the project environment before production deployment.
