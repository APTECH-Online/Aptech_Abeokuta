# APTECH Abeokuta — Interactive Conversion Implementation Report

## 1. Files/components changed
- `components/home/ProgramFinder.tsx` — upgraded the existing 2-step finder to a 5-question progressive career discovery experience, live-course recommendations, result screen, lead capture, and advisor CTA.
- `components/home/AdvisorGuide.tsx` — added the guided advisor/WhatsApp choice flow.
- `components/home/TechChallenge.tsx` — added the separate five-question, timed Tech IQ Challenge with score, sharing, retry and programme-discovery CTAs.
- `app/(site)/tech-challenge/page.tsx` — added a standalone challenge route.
- `app/(site)/page.tsx` — retained the existing homepage structure and placed the upgraded finder as the primary interaction; placed the Tech Challenge lower on the page.
- `app/(site)/admissions/quiz-actions.ts` — added the existing CRM lead-capture path for career-quiz results.
- `components/admissions/AdmissionsForm.tsx` — allows programme/source prefill from quiz/advisor journeys and recognizes the new source values.
- `lib/program-recommendation.ts` — shared recommendation scoring based on live course content, without hardcoding programme names.
- `lib/crm/lead-detail.ts` and `app/admin/(dashboard)/leads/[id]/page.tsx` — expose career-discovery context to CRM staff.
- `types/db.ts` and `lib/validation.ts` — added the new CRM lead-source values.
- `app/globals.css` — added styling for the new interactions using the existing visual language and mobile patterns.

## 2. Database changes
Added `supabase/migrations/0025_interactive_conversion.sql`.

Changes:
- Adds `career_quiz`, `tech_challenge`, and `advisor_request` to the existing `lead_source` enum.
- Adds `interactive_quiz_results`, linked to the existing `leads` and `programmes` tables.
- Stores quiz answers, recommendation context, career interest, goal, experience level, completion time, and exact public course recommendation.
- RLS restricts CRM reads to Admissions Officers and Super Admins.

No existing records are deleted or duplicated by the migration.

## 3. API/server changes
- Added a server action for post-result career-quiz lead capture.
- Reuses the existing Supabase admin client, lead reference generator, rate limiter, notifications and CRM tables.
- Existing admissions/contact server actions remain unchanged apart from accepting the new source values.
- No separate lead database was introduced.

## 4. CRM integration
A quiz lead is saved into the existing `leads` table with source `career_quiz`.

The existing `lead_interests` table receives the matching CRM programme family where one exists:
- Advanced Diploma course → existing ADSE programme
- Smart Pro course → existing SMARTPRO programme
- ACNS course → existing ACNS programme
- Short courses → exact recommended course is retained in `interactive_quiz_results`, because the current CRM `programmes` table does not contain individual short-course records.

The Account Officer can see:
- Recommended course/programme
- Secondary recommendation
- Career interest
- Goal
- Experience level
- Quiz summary
- Existing contact/source/status/activity information

## 5. New user flows
### Career discovery
Homepage → existing “Which programme is right for you?” → 5 progressive questions → personalized recommendation → programme details or advisor → optional lead capture → CRM.

### Tech Challenge
Homepage secondary section or `/tech-challenge` → 5 questions → 60-second countdown → score → share/retry → programme discovery or advisor.

### Advisor
Advisor CTA → “What would you like help with?” → choosing a programme / fees / schedule / admission / career opportunities / something else → WhatsApp with contextual message.

## 6. Analytics/events
The repository did not contain an existing analytics platform integration, so no new analytics vendor was introduced.

The interactive components emit lightweight browser `aptech:conversion` custom events for future analytics integration, including:
- quiz started / step completed
- programme CTA clicked
- lead submitted
- Tech Challenge started/completed

## 7. Responsive/mobile changes
- Finder options collapse to one column on small screens.
- Touch targets remain large and card-based.
- Result content wraps without horizontal overflow.
- Advisor modal is constrained to the viewport with internal scrolling.
- Challenge controls and result CTAs wrap on small screens.
- Existing header, footer, navigation and public layout were not redesigned.

## 8. Tests performed
- Audited existing homepage finder, course source, CRM lead schema, admissions flow, WhatsApp helper, CRM lead detail and analytics footprint before changes.
- Verified source-level references for new files, migration, lead-source values and CRM result retrieval.
- Attempted `npm run build`; it could not start because the uploaded `node_modules` tree is incomplete (`next` executable unavailable).
- Attempted offline TypeScript checking; the environment lacks the installed Node/React type-definition contents required by the project.
- Attempted `npm ci --ignore-scripts`; the package installation timed out in the sandbox.

## 9. Issues / assumptions
- The live Supabase migration must be applied before the new quiz lead flow can write `interactive_quiz_results` or use the new lead-source enum values.
- Recommendation logic is deliberately content-based: it scores the live published course catalogue rather than embedding programme names in the quiz component.
- The current CRM has three programme-family records while the public catalogue also contains short courses; short-course recommendations therefore remain exact in the quiz result record rather than being incorrectly forced into an unrelated CRM programme.
- The Tech Challenge does not create a lead by itself; it is an engagement/re-entry experience. Advisor or enquiry actions can then move the visitor into the existing conversion flow.
