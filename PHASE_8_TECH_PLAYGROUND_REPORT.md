# Phase 8 — Tech Playground

Extends the Phase 7 Tech Zone (same tables, CRM lead flow, admin area, permissions). No new auth, CMS or analytics system.

## Routes
/tech-playground (hub) · career-pathfinder · tech-career-quiz · tech-detective (+ /code /web /sql /cyber) · weekly-challenge · leaderboard · tech-iq · data-detective · code-lab · 7-day-challenge · spin-to-learn · badges (noindex)

## Database — supabase/migrations/0032_tech_playground.sql
- tech_challenges: time_limit_seconds, playground_kind, detective_category, streak_day
- playground_participants (hashed anonymous token, display name, hidden flag), playground_badges, playground_streak_days, playground_activities
- tech_challenge_attempts: participant_id, is_hidden
- Event vocabulary extended; 14 managed challenges / 69 questions seeded (weekly, 4 detective cases, data detective, speed round, 7 streak days). Seeds never overwrite staff edits.

## Key behaviours
- Answers are checked and locked server-side per question (immediate feedback, answer key never sent beforehand); completion time is measured server-side; timed attempts reject late answers.
- Participants = random browser token (localStorage), only its SHA-256 hash stored. Badges/streak/leaderboard name are tied to that browser.
- Leaderboard: best attempt per named player, ranked by % then time; Today/Week/Month/All Time (WAT boundaries); streak days excluded; no email/phone exposed. Display names validated (length, charset, no links/numbers, blocklist, unique).
- Pathfinder/quiz results re-scored server-side; optional lead capture (email OR phone/WhatsApp, consent) -> existing leads, lead_interests, interactions, notifications, source tech_challenge.
- Quiz results reuse existing captureChallengeLead.
- Code Lab preview runs in a fully sandboxed iframe (no scripts).
- Spin to Learn: educational only, nothing at stake, not persisted.
- Tech Zone listing/sitemap exclude playground-managed challenges (no duplicate pages).

## Admin
/admin/challenges: new Playground placement/time limit/category/streak day/dataset JSON fields (invalid JSON rejected); /admin/challenges/leaderboard: hide scores or players.

## Not verified
No dependencies were installed in the workspace: files pass a TypeScript syntax check (40 files, 0 errors) but `next build`, type-check, the migration against a real database, and browser/mobile testing have NOT been run. Run migration 0032, then `npm run build`.

## Spec gaps / decisions
- Prompt text ends mid-way through Spin to Learn; later sections (if any) were not available.
- Leaderboard in-memory dedupe reads the latest 1,000 qualifying attempts per period — move to a SQL view/RPC if traffic grows.
- Rate limiter is the existing per-instance in-memory one; leaderboard is gameable by clearing storage (new token).
- Public display names from possibly under-18 users: moderation page provided; consider a privacy-policy mention.
