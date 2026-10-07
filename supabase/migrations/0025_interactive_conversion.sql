-- Interactive conversion experiences: programme discovery + Tech Challenge context.
-- Reuses the existing leads, lead_interests and interactions CRM model.

alter type lead_source add value if not exists 'career_quiz';
alter type lead_source add value if not exists 'tech_challenge';
alter type lead_source add value if not exists 'advisor_request';

create table if not exists interactive_quiz_results (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  quiz_type text not null default 'career_discovery' check (quiz_type in ('career_discovery')),
  answers jsonb not null default '{}'::jsonb,
  recommended_programme_id uuid references programmes (id) on delete set null,
  secondary_programme_id uuid references programmes (id) on delete set null,
  recommended_course_slug text,
  recommended_course_title text,
  secondary_course_slug text,
  secondary_course_title text,
  career_interest text,
  goal text,
  experience_level text,
  result_summary text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_interactive_quiz_results_lead_id on interactive_quiz_results (lead_id);
create index if not exists idx_interactive_quiz_results_programme_id on interactive_quiz_results (recommended_programme_id);
create index if not exists idx_interactive_quiz_results_completed_at on interactive_quiz_results (completed_at desc);

alter table interactive_quiz_results enable row level security;

create policy "interactive_quiz_results_select_admissions_or_super_admin" on interactive_quiz_results
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));
