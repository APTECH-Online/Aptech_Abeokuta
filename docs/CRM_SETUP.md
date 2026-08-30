# APTECH Abeokuta — CRM & Admissions Management System

This document covers the CRM/admissions system added on top of the existing
marketing website. For the base site, see `README.md`.

## 1. What was built

- A real admissions enquiry form at `/admissions`, backed by Supabase Postgres.
- A staff-only CRM at `/admin` (leads, applications, follow-ups, programmes,
  reports, settings) with Supabase Auth, role-based permissions, and an
  audit log.

Nothing about the existing public pages, styling, or navigation changed
except the admissions form itself and `robots.txt` (which now disallows
`/admin`).

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL, `anon` public key,
   and `service_role` key.
3. In the **SQL Editor**, run the contents of `supabase/migrations/0001_init.sql`,
   then `supabase/seed.sql` (seeds the three real programmes).
4. In **Authentication → Users**, add your first staff member (email +
   password, or send an invite).
5. Back in the SQL Editor, promote that user to Super Admin:

   ```sql
   insert into staff (id, full_name, email, role, is_active)
   values ('<auth-user-uuid-from-step-4>', 'Your Name', 'you@example.com', 'super_admin', true);
   ```

   Once you have a Super Admin, you can invite everyone else from
   `/admin/settings` instead of using SQL.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public key — safe for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server-only.** Never prefix with `NEXT_PUBLIC_`, never commit it |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Used for metadata/OpenGraph |
| `RESEND_API_KEY` | Optional | If unset, emails are logged server-side instead of sent |
| `EMAIL_FROM_ADDRESS` | Optional | From-address for outgoing email |
| `ADMISSIONS_NOTIFICATION_EMAIL` | Optional | Defaults to aptech.abeokuta@gmail.com |

## 4. Run locally

```bash
npm install
npm run dev
```

- Public site: http://localhost:3000
- Admissions form: http://localhost:3000/admissions
- CRM: http://localhost:3000/admin/login

Without Supabase configured, the public site (including `/admissions`) still
renders — the enquiry form shows a "temporarily unavailable" message instead
of crashing, and `/admin` shows a clear "not configured" state rather than a
500 error.

## 5. Deploy to Vercel

1. Push this repository to GitHub (or your Git provider of choice).
2. Import the repo in Vercel.
3. Add the environment variables from the table above in **Project Settings
   → Environment Variables** (Production and Preview).
4. Deploy. `/admin` is excluded from `robots.txt` and every page under it
   sets `robots: { index: false, follow: false }`.

No other Vercel configuration is required — this uses only Next.js Server
Actions and Route Handlers, both supported out of the box.

## 6. Roles

| Role | Can do |
|---|---|
| Super Admin | Everything, including staff management |
| Admissions Manager | Manage programmes, assign leads, everything below |
| Admissions Officer | Edit leads, log interactions, follow-ups, applications |
| Counsellor | Edit leads, log interactions, follow-ups, applications |
| Viewer | Read-only — cannot edit leads, export data, or manage programmes |

Enforced in `lib/auth.ts` and re-checked inside every Server Action —
never trust the UI alone.

## 7. Data model

See `supabase/migrations/0001_init.sql` for the authoritative schema
(`staff`, `programmes`, `leads`, `lead_education`, `lead_interests`,
`applications`, `interactions`, `follow_ups`, `audit_logs`) and
`types/db.ts` for the matching TypeScript types.

## 8. Known limitations / recommended next steps

- **Rate limiting is per-instance, in-memory** (`lib/rate-limit.ts`). It
  meaningfully blocks rapid-fire abuse but isn't a global guarantee on
  serverless. For a hard cap, back it with Upstash Redis or Vercel KV.
- **Programme filter on the Leads table** is applied after pagination
  (documented inline in `lib/crm/leads.ts`) because a lead's programme lives
  in a joined `lead_interests` row, not a column on `leads`. Fine at current
  data volumes; a Postgres view exposing each lead's latest programme as a
  real column would let this filter before pagination.
- **Dashboard/report aggregation** reads up to the most recent 2,000 leads
  and applications to compute charts, rather than the full table — plenty
  for this school's volume, but should move to SQL-side aggregation (RPC or
  materialized view) if the CRM ever holds tens of thousands of records.
- **Email** logs to the server console until `RESEND_API_KEY` is set —
  intentional so the form always "works," but you should configure a real
  provider before relying on the acknowledgement/notification emails.
- **Duplicate detection** matches on email first, then normalized last-10-
  digits of phone/WhatsApp. It intentionally merges rather than blocks, so a
  determined duplicate submission still updates one primary lead record
  instead of creating a second one — but it isn't fuzzy name-matching, so
  a lead who changes both their email and phone between visits will not be
  detected as the same person.
- **Staff invites** rely on Supabase Auth's built-in invite email, which
  requires SMTP to be configured on the Supabase project (or its default
  limited sender). If that isn't set up, `/admin/settings` surfaces a clear
  fallback message with the manual SQL alternative.
