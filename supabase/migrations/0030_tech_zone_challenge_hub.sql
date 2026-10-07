-- Aptech Tech Zone: managed challenge hub, attempts and CRM context.
-- Reuses existing leads, interactions, conversion_events and programme records.

create table if not exists tech_challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'technology',
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  estimated_minutes integer not null default 3 check (estimated_minutes between 1 and 60),
  challenge_type text not null default 'quiz' check (challenge_type in ('quiz','debug','logic','sql','weekly')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  is_featured boolean not null default false,
  is_weekly boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  sort_order integer not null default 0,
  scoring_config jsonb not null default '{}'::jsonb,
  recommendation_rules jsonb not null default '[]'::jsonb,
  created_by uuid references staff(id) on delete set null,
  updated_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tech_challenges_status_order on tech_challenges(status, sort_order);
create index if not exists idx_tech_challenges_weekly on tech_challenges(is_weekly, status);

create table if not exists tech_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references tech_challenges(id) on delete cascade,
  question text not null,
  question_type text not null default 'multiple_choice' check (question_type in ('multiple_choice')),
  options jsonb not null default '[]'::jsonb,
  correct_answer integer not null check (correct_answer >= 0),
  explanation text,
  skill_area text not null default 'Technology Fundamentals',
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  points integer not null default 10 check (points between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tech_challenge_question_options_array check (jsonb_typeof(options) = 'array')
);

create index if not exists idx_tech_challenge_questions_challenge on tech_challenge_questions(challenge_id, sort_order);

create table if not exists tech_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references tech_challenges(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  session_id text,
  score integer not null default 0 check (score >= 0),
  max_score integer not null default 0 check (max_score >= 0),
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  result_level text,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  completion_time_seconds integer,
  difficulty_reached text,
  completion_status text not null default 'started' check (completion_status in ('started','completed','abandoned','timed_out')),
  recommended_programme_ids uuid[] not null default '{}',
  skill_areas text[] not null default '{}',
  attribution jsonb not null default '{}'::jsonb,
  consented_to_follow_up boolean not null default false,
  communication_preference text check (communication_preference in ('email','whatsapp','phone','none')),
  result_viewed_at timestamptz,
  captured_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_tech_challenge_attempts_challenge on tech_challenge_attempts(challenge_id, created_at desc);
create index if not exists idx_tech_challenge_attempts_lead on tech_challenge_attempts(lead_id, created_at desc);
create index if not exists idx_tech_challenge_attempts_session on tech_challenge_attempts(session_id);

create table if not exists tech_challenge_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references tech_challenge_attempts(id) on delete cascade,
  question_id uuid not null references tech_challenge_questions(id) on delete cascade,
  answer_index integer not null check (answer_index >= 0),
  is_correct boolean not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create index if not exists idx_tech_challenge_answers_attempt on tech_challenge_answers(attempt_id);

create or replace function set_tech_challenge_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tech_challenges_updated_at on tech_challenges;
create trigger trg_tech_challenges_updated_at before update on tech_challenges
for each row execute function set_tech_challenge_updated_at();

drop trigger if exists trg_tech_challenge_questions_updated_at on tech_challenge_questions;
create trigger trg_tech_challenge_questions_updated_at before update on tech_challenge_questions
for each row execute function set_tech_challenge_updated_at();

alter table tech_challenges enable row level security;
alter table tech_challenge_questions enable row level security;
alter table tech_challenge_attempts enable row level security;
alter table tech_challenge_answers enable row level security;

create policy "tech_challenges_public_active_select" on tech_challenges
  for select using (
    status = 'active'
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
  );

create policy "tech_challenges_staff_select" on tech_challenges
  for select using (current_staff_role() in ('super_admin','content_manager'));
create policy "tech_challenge_questions_staff_select" on tech_challenge_questions
  for select using (current_staff_role() in ('super_admin','content_manager'));

-- Attempts and answers are written server-side through the service-role client.
-- No public insert/select policy is granted, preventing answer-key exposure and
-- direct manipulation of scores from the browser.

insert into tech_challenges (name, slug, description, category, difficulty, estimated_minutes, challenge_type, status, is_featured, sort_order)
values
  ('Digital Skills Speed Test', 'digital-skills-speed-test', 'A 60-second test of technology awareness, digital concepts, problem solving and programming fundamentals.', 'Digital Skills', 'beginner', 1, 'quiz', 'active', true, 10),
  ('Debug This!', 'debug-this', 'Find the bug, understand why it happens and build your debugging instincts.', 'Programming', 'beginner', 3, 'debug', 'active', true, 20),
  ('Code Breaker', 'code-breaker', 'Short logic and programming puzzles built around patterns, conditions and algorithms.', 'Problem Solving', 'intermediate', 4, 'logic', 'active', false, 30),
  ('SQL Detective', 'sql-detective', 'Use simple SQL and data reasoning to investigate a small fictional dataset.', 'Databases', 'beginner', 4, 'sql', 'active', false, 40),
  ('Weekly Tech Challenge', 'weekly-tech-challenge', 'A rotating challenge managed by the Aptech team.', 'Technology', 'intermediate', 3, 'weekly', 'draft', false, 50)
on conflict (slug) do update set name=excluded.name, description=excluded.description, category=excluded.category, difficulty=excluded.difficulty, estimated_minutes=excluded.estimated_minutes, challenge_type=excluded.challenge_type;

-- Seed questions only when the challenge has no questions yet. Correct answers
-- remain server-only because public reads are mediated by the server action.
do $$
declare
  c uuid;
begin
  select id into c from tech_challenges where slug='digital-skills-speed-test';
  if not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,sort_order) values
    (c,'Which technology is primarily used to structure a webpage?','["HTML","SQL","Python","Excel"]',0,'HTML provides the structure and semantic elements of a webpage.','Technology Fundamentals',1),
    (c,'What does a database help you do?','["Store and organise information","Design a logo","Charge a phone","Print a keyboard"]',0,'Databases organise information so it can be stored, searched and updated.','Databases',2),
    (c,'Which is a programming language?','["Python","Wi-Fi","HDMI","Bluetooth"]',0,'Python is a general-purpose programming language.','Programming',3),
    (c,'What is cybersecurity mainly concerned with?','["Protecting systems and information","Making websites colourful","Typing faster","Replacing batteries"]',0,'Cybersecurity focuses on protecting systems, networks and information.','Technology Fundamentals',4),
    (c,'Which skill is especially useful when working with data?','["Analysis","Guessing","Ignoring patterns","Avoiding numbers"]',0,'Analysis helps people interpret patterns and make useful decisions from data.','Data',5);
  end if;
  select id into c from tech_challenges where slug='debug-this';
  if not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,sort_order) values
    (c,'What is wrong with: name = "John"; print(Name)','["Name uses a different capitalization","The string is too short","print cannot display text","There is no bug"]',0,'Python variable names are case-sensitive, so Name is different from name.','Programming',1),
    (c,'What is wrong with: numbers = [1,2,3]; print(numbers[3])','["The index is outside the list","Lists cannot contain numbers","print is invalid","The list must be sorted"]',0,'A three-item list has indexes 0, 1 and 2.','Programming',2),
    (c,'What is wrong with: if age > 18 print("Adult")','["A colon is missing after the condition","age must be text","print must be removed","if cannot compare numbers"]',0,'Python requires a colon after an if condition.','Programming',3),
    (c,'What is wrong with: total = price + tax; price = 100','["price is used before it is assigned","Addition is not allowed","tax must be a string","total must be a list"]',0,'price must be assigned before the expression uses it.','Problem Solving',4),
    (c,'What is wrong with: SELECT name FROM students WHERE score > 80;','["Nothing — the query is valid","SELECT cannot use WHERE","score cannot be compared","FROM must come last"]',0,'This is a valid basic SQL query.','Databases',5);
  end if;
  select id into c from tech_challenges where slug='code-breaker';
  if not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,sort_order) values
    (c,'What comes next: 2, 4, 8, 16, ?','["24","30","32","34"]',2,'Each value doubles the previous value.','Problem Solving',1),
    (c,'Which condition means a number is between 10 and 20 inclusive?','["n > 10 AND n < 20","n >= 10 AND n <= 20","n < 10 OR n > 20","n == 10 OR 20"]',1,'Both boundary values are included.','Programming',2),
    (c,'Which structure repeats a block while a condition remains true?','["Loop","Variable","Comment","Database"]',0,'Loops repeat instructions according to a condition or sequence.','Programming',3),
    (c,'Which algorithmic idea breaks a large problem into smaller parts?','["Decomposition","Decoration","Duplication","Compression"]',0,'Decomposition makes complex problems easier to solve by splitting them into smaller tasks.','Problem Solving',4),
    (c,'If A is true and B is false, what is A AND B?','["True","False","Maybe","Error"]',1,'AND is true only when both conditions are true.','Programming',5);
  end if;
  select id into c from tech_challenges where slug='sql-detective';
  if not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,sort_order) values
    (c,'Which SQL clause filters rows?','["WHERE","ORDER BY","GROUP BY","SELECT"]',0,'WHERE filters rows according to a condition.','Databases',1),
    (c,'Which query returns students enrolled in Python?','["SELECT * FROM students WHERE course = ''Python''","GET students IF Python","SELECT Python FROM students","FIND students course Python"]',0,'The first query uses standard SQL filtering syntax.','Databases',2),
    (c,'Which function returns the largest value?','["MAX()","TOP()","HIGH()","LARGE()"]',0,'MAX returns the largest value in a column or expression.','Databases',3),
    (c,'Which column would best identify one student uniquely?','["Student ID","First name","City","Course"]',0,'A unique student ID is designed to distinguish records.','Data',4),
    (c,'Which clause sorts query results?','["ORDER BY","SORT","ARRANGE BY","GROUP"]',0,'ORDER BY controls the sorting of returned rows.','Databases',5);
  end if;
end $$;

update tech_challenges set recommendation_rules = '[{"skillArea":"Programming","programmeCodes":["ADSE"]},{"skillArea":"Problem Solving","programmeCodes":["ADSE"]}]'::jsonb where slug in ('debug-this','code-breaker');
update tech_challenges set recommendation_rules = '[{"skillArea":"Databases","programmeCodes":["ADSE","ACNS"]},{"skillArea":"Data","programmeCodes":["ADSE"]}]'::jsonb where slug = 'sql-detective';
update tech_challenges set recommendation_rules = '[{"skillArea":"Programming","programmeCodes":["ADSE"]},{"skillArea":"Data","programmeCodes":["ADSE"]},{"skillArea":"Technology Fundamentals","programmeCodes":["ADSE","ACNS"]}]'::jsonb where slug = 'digital-skills-speed-test';

-- Extend the existing analytics vocabulary without creating a second analytics system.
alter table conversion_events drop constraint if exists conversion_events_event_name_check;
alter table conversion_events add constraint conversion_events_event_name_check check (event_name in (
  'career_quiz_started','career_quiz_recommendation_viewed','career_quiz_completed',
  'tech_challenge_started','tech_challenge_completed','comparison_started','comparison_programme_added',
  'comparison_programme_removed','comparison_completed','comparison_cta_clicked','career_pathway_viewed',
  'student_story_viewed','student_project_viewed','advisor_cta_clicked','enquiry_cta_clicked','application_cta_clicked',
  'campaign_landing_viewed','campaign_cta_clicked','tech_zone_viewed','challenge_started','challenge_completed',
  'challenge_result_viewed','challenge_lead_captured','challenge_cta_clicked','challenge_whatsapp_clicked'
));
