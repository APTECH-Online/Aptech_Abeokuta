# Aptech Abeokuta — Lead Management & Follow-Up Conversion System

## Audit findings

The existing CRM already contained and was reused for:
- `leads`, `lead_interests`, `lead_education`
- `applications` linked directly to `leads`
- `interactions` for notes/contact history
- `follow_ups` with assignment, due dates and statuses
- staff assignment and granular Admissions permissions
- CRM notifications and follow-up reminder infrastructure
- existing lead/application detail pages and dashboard

No second CRM or duplicate lead table was introduced.

## Changes made

1. **Lead pipeline**
   - Existing statuses retained for backwards compatibility.
   - Primary pipeline normalized to New → Contacted → Interested → Follow-up → Application Started → Application Submitted → Enrolled → Lost.
   - Existing legacy statuses such as Counselling, Admission Offered, Unreachable and Not Interested remain available.

2. **Lead priority**
   - Added `lead_priority` (`high`, `medium`, `low`) to the existing `leads` table.
   - Priority is recalculated from existing CRM signals, including programme interest, advisor/admission interaction, quiz engagement, applications and repeated interactions.
   - It is explicitly a prioritisation aid, not an enrolment prediction.

3. **Lead list/search**
   - Added priority filtering.
   - Programme filtering now happens before pagination.
   - Programme-name searches can constrain the lead query without loading all leads into memory.
   - Existing name, email, phone and lead-reference search remains.

4. **Lead profile**
   - Priority is visible alongside pipeline status.
   - Added Call, WhatsApp and Email actions.
   - Activity timeline now combines interactions, quiz completion, follow-up creation and application activity.
   - Existing assignment, notes, follow-up scheduling and application actions remain in place.

5. **Follow-up dashboard**
   - Added compact counts for overdue, due today, upcoming and uncontacted leads.
   - Added assigned-staff filtering to the existing follow-up list.
   - Existing completion/cancellation workflow is reused.

6. **Application lifecycle**
   - Existing “Start application” action now creates a `draft` application and moves the lead to `application_started`.
   - Application status changes map the lead through `application_submitted`, `admission_offered` and `enrolled` where appropriate.
   - Existing `lead_id` foreign-key relationship remains the attribution path from Lead → Application → Enrollment.

7. **Duplicate protection**
   - Existing duplicate helper was strengthened to check email, exact phone/WhatsApp and normalized phone variants.
   - Career Quiz lead capture now reuses the same duplicate-detection path instead of maintaining a separate duplicate algorithm.

8. **Notifications**
   - Existing notification infrastructure is reused.
   - Lead assignment and follow-up scheduling now generate targeted staff notifications where appropriate.
   - Follow-up completion is recorded in the lead activity history.

9. **Database**
   - Added `supabase/migrations/0026_lead_management_pipeline.sql`.
   - The migration adds priority, indexes, recalculation functions/triggers and backfills existing leads.
   - No duplicate lead/application/follow-up table was introduced.

## Permissions

Existing module/role permission gates are preserved. Lead assignment, status changes, interactions, applications and follow-ups continue through the existing CRM authorization helpers.

## Verification

- TypeScript/TSX source syntax parse: **243 files checked, 0 syntax diagnostics**.
- A full `next build` could not be completed in the sandbox because dependency installation/build execution timed out; the previous Vercel environment remains the authoritative production dependency environment.
- No website redesign or unrelated public routes were intentionally changed.
