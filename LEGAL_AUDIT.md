# Website data-practices audit & legal update (8 Oct 2026)

## What the site actually does (found in code)
| Area | Finding |
|---|---|
| Lead capture points | Admissions form, Contact form, Career quiz, Tech Zone / Tech IQ (4 places) |
| Personal data collected | Name, email, phone/WhatsApp, gender, **date of birth**, address, education history, programme interest, quiz answers, challenge scores |
| Tracking | UTM/referrer/landing page in `localStorage`; random session ID in `sessionStorage`; `conversion_events` rows (linked to a lead once a form is submitted) |
| Other browser storage | Compare shortlist, Tech Zone recent questions (`localStorage`) |
| IP address | Used only for in-memory rate limiting; not stored |
| Third parties | Supabase (database), Google Maps embed (Contact page), WhatsApp links, social links, optional email provider. No ad/analytics trackers found |

## Gaps found
1. Old policy said "last updated: <current year>", changing automatically with no version history.
2. Old policy and terms said they were an unreviewed "working draft" to visitors.
3. Policy did not mention: date of birth / under-18s, quiz and Tech Zone data, attribution and analytics, browser storage, third parties, international transfers, lawful bases, rights detail, NDPC complaints, marketing opt-out.
4. Admissions form used passive "by submitting you agree" text; Contact form and Career quiz had no consent at all. Tech Zone had a checkbox but no link to the policy.
5. No record of who agreed to what, or to which version.
6. Under-18 applicants were not flagged anywhere in the CRM.

## What was changed
- New `legal_documents` table: versioned, editable Privacy Policy and Terms (draft → publish, Super Admin publishes). Admin: **Settings → Legal & policies**.
- New `lead_consents` ledger + `leads.privacy_consent_at` / `marketing_opt_in`.
- Required consent checkbox (+ optional marketing opt-in) on Admissions, Contact and Career quiz; Tech Zone checkbox now links to the policy. Server-side validation on each.
- Consent is recorded with the live policy versions; shown on each lead's profile with history.
- Applicants under 18 are flagged on the lead and logged in the timeline.
- `/privacy` and `/terms` rewritten (14 and 15 sections), read from the CMS with a built-in fallback.

## Still needs a human
- Legal review of both documents (retention, sharing, refunds, governing law).
- A process for access/correction/deletion requests (currently: email, then log on the lead timeline).
- Decide retention periods for non-converting enquiries and put them in the policy.
- Run migration `0031_legal_documents_and_consent.sql`.
