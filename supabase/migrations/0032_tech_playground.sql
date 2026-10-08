-- Aptech Tech Playground: participants, badges, streaks, leaderboard support and seeded managed challenges.
-- Extends the Tech Zone tables from 0030 — no second challenge system.

-- ===== Challenge extensions =====
alter table tech_challenges add column if not exists time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds between 10 and 3600);
alter table tech_challenges add column if not exists playground_kind text check (playground_kind is null or playground_kind in ('weekly','detective','speed_round','data_detective','daily'));
alter table tech_challenges add column if not exists detective_category text check (detective_category is null or detective_category in ('code','web','data','sql','cyber'));
alter table tech_challenges add column if not exists streak_day integer check (streak_day is null or streak_day between 1 and 7);
create unique index if not exists uq_tech_challenges_streak_day on tech_challenges(streak_day) where streak_day is not null and status <> 'archived';

-- ===== Lightweight participants (no account required) =====
-- The browser holds a random secret token; only its SHA-256 hash is stored.
create table if not exists playground_participants (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  display_name text check (display_name is null or char_length(display_name) between 3 and 20),
  display_name_key text unique,
  is_hidden boolean not null default false,
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table tech_challenge_attempts add column if not exists participant_id uuid references playground_participants(id) on delete set null;
alter table tech_challenge_attempts add column if not exists is_hidden boolean not null default false;
create index if not exists idx_tech_attempts_participant on tech_challenge_attempts(participant_id, completed_at desc);
create index if not exists idx_tech_attempts_leaderboard on tech_challenge_attempts(completed_at desc) where completion_status = 'completed' and participant_id is not null;

create table if not exists playground_badges (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references playground_participants(id) on delete cascade,
  badge_key text not null check (badge_key in ('tech_explorer','code_starter','data_detective','speed_champion','challenge_master','streak_7','top_10')),
  awarded_at timestamptz not null default now(),
  unique (participant_id, badge_key)
);

create table if not exists playground_streak_days (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references playground_participants(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  attempt_id uuid references tech_challenge_attempts(id) on delete set null,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  unique (participant_id, day_number)
);

-- Non-quiz activities (pathfinder, personality quiz, code lab, spin) and their optional lead link.
create table if not exists playground_activities (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references playground_participants(id) on delete set null,
  kind text not null check (kind in ('career_pathfinder','career_quiz','code_lab','spin')),
  result jsonb not null default '{}'::jsonb,
  lead_id uuid references leads(id) on delete set null,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_playground_activities_kind on playground_activities(kind, created_at desc);

-- All playground tables are written/read only via the service-role server actions.
alter table playground_participants enable row level security;
alter table playground_badges enable row level security;
alter table playground_streak_days enable row level security;
alter table playground_activities enable row level security;

-- Analytics vocabulary (existing conversion_events table).
alter table conversion_events drop constraint if exists conversion_events_event_name_check;
alter table conversion_events add constraint conversion_events_event_name_check check (event_name in (
  'career_quiz_started','career_quiz_recommendation_viewed','career_quiz_completed',
  'tech_challenge_started','tech_challenge_completed','comparison_started','comparison_programme_added',
  'comparison_programme_removed','comparison_completed','comparison_cta_clicked','career_pathway_viewed',
  'student_story_viewed','student_project_viewed','advisor_cta_clicked','enquiry_cta_clicked','application_cta_clicked',
  'campaign_landing_viewed','campaign_cta_clicked','tech_zone_viewed','challenge_started','challenge_completed',
  'challenge_result_viewed','challenge_lead_captured','challenge_cta_clicked','challenge_whatsapp_clicked',
  'playground_viewed','playground_activity_started','playground_activity_completed','playground_cta_clicked',
  'playground_share_clicked','playground_badge_earned','playground_leaderboard_name_set','playground_lead_captured'
));


-- ===== Seed challenges (never overwrites staff edits; questions seeded only when empty) =====

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Can You Crack the Code?','playground-weekly-challenge','This week’s rotating challenge: five quick questions across code, data and security. Beat the clock and climb the Tech Arena.','Technology','intermediate',1,'weekly','active',true,true,10,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,60,'weekly',null,null,date_trunc('week', now()))
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Code Detective: The Missing Output','case-code-detective','Four short programs are misbehaving. Find the bug in each before time runs out.','Programming','beginner',2,'debug','active',true,false,20,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'detective','code',null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Web Detective: The Broken Page','case-web-detective','Something is wrong with each webpage. Diagnose it quickly.','Web','beginner',2,'debug','active',false,false,21,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'detective','web',null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('SQL Detective: The Query That Lied','case-sql-detective','Each SQL query has a problem. Find it before the clock runs out.','Databases','intermediate',2,'sql','active',false,false,22,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'detective','sql',null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Cyber Detective: Suspicious Activity','case-cyber-detective','Read each scenario and identify the threat or the right response.','Cybersecurity','beginner',2,'quiz','active',false,false,23,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'detective','cyber',null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Data Detective: The Sales Mystery','data-detective-sales','Study the sales table and answer like an analyst.','Data','beginner',3,'quiz','active',true,false,30,'{"dataset": {"caption": "Monthly sales at a small phone shop (₦)", "columns": ["Month", "Phones", "Accessories", "Total"], "rows": [["Jan", "₦150,000", "₦100,000", "₦250,000"], ["Feb", "₦190,000", "₦120,000", "₦310,000"], ["Mar", "₦260,000", "₦160,000", "₦420,000"], ["Apr", "₦230,000", "₦160,000", "₦390,000"], ["May", "₦330,000", "₦180,000", "₦510,000"], ["Jun", "₦300,000", "₦170,000", "₦470,000"]]}}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,120,'data_detective','data',null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('60-Second Tech IQ','tech-iq-speed-round','Rapid-fire questions across programming, databases, web, data and security. How many can you land in 60 seconds?','Technology','intermediate',1,'quiz','active',true,false,40,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,60,'speed_round',null,null,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 1 — Digital Skills','streak-day-1','Today’s quick digital skills challenge in the 7-Day Tech Streak.','Digital Skills','beginner',1,'quiz','active',false,false,51,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,1,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 2 — Programming','streak-day-2','Today’s quick programming challenge in the 7-Day Tech Streak.','Programming','beginner',1,'quiz','active',false,false,52,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,2,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 3 — Data','streak-day-3','Today’s quick data challenge in the 7-Day Tech Streak.','Data','beginner',1,'quiz','active',false,false,53,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,3,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 4 — Web','streak-day-4','Today’s quick web challenge in the 7-Day Tech Streak.','Web','beginner',1,'quiz','active',false,false,54,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,4,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 5 — Database','streak-day-5','Today’s quick database challenge in the 7-Day Tech Streak.','Database','beginner',1,'quiz','active',false,false,55,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,5,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 6 — Cybersecurity','streak-day-6','Today’s quick cybersecurity challenge in the 7-Day Tech Streak.','Cybersecurity','beginner',1,'quiz','active',false,false,56,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,6,null)
on conflict (slug) do nothing;

insert into tech_challenges (name,slug,description,category,difficulty,estimated_minutes,challenge_type,status,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules,time_limit_seconds,playground_kind,detective_category,streak_day,start_date)
values ('Day 7 — Final Challenge','streak-day-7','Today’s quick final challenge challenge in the 7-Day Tech Streak.','Technology','beginner',1,'quiz','active',false,false,57,'{}'::jsonb,'[{"skillArea": "Programming", "programmeCodes": ["ADSE"]}, {"skillArea": "Problem Solving", "programmeCodes": ["ADSE"]}, {"skillArea": "Web", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Data", "programmeCodes": ["ADSE", "SMARTPRO"]}, {"skillArea": "Databases", "programmeCodes": ["ADSE"]}, {"skillArea": "Cybersecurity", "programmeCodes": ["ACNS", "SMARTPRO"]}, {"skillArea": "Digital Skills", "programmeCodes": ["SMARTPRO"]}, {"skillArea": "Technology Fundamentals", "programmeCodes": ["ADSE", "ACNS"]}]'::jsonb,90,'daily',null,7,null)
on conflict (slug) do nothing;


do $$
declare c uuid;
begin
  select id into c from tech_challenges where slug='playground-weekly-challenge';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'What does this print?
```
x = [1, 2, 3]
print(len(x) * 2)
```','["3", "6", "2", "[1, 2, 3, 1, 2, 3]"]',1,'len(x) is 3, and 3 × 2 is 6.','Programming','intermediate',10,1),
    (c,'Which SQL query returns the three highest scores?','["SELECT score FROM results ORDER BY score DESC LIMIT 3;", "SELECT TOP score FROM results;", "SELECT score FROM results GROUP BY 3;", "SELECT MAX(score, 3) FROM results;"]',0,'Sort from highest to lowest, then limit the rows returned.','Databases','intermediate',10,2),
    (c,'A website returns HTTP status 404. What does that mean?','["The server crashed", "The page or resource was not found", "You are not logged in", "The request was successful"]',1,'404 means the server could not find the requested resource.','Web','beginner',10,3),
    (c,'What is the output?
```
for i in range(3):
    print(i)
```','["1 2 3", "0 1 2", "0 1 2 3", "3 2 1"]',1,'range(3) produces 0, 1 and 2.','Programming','beginner',10,4),
    (c,'Which is the strongest account-security habit?','["Reusing one memorable password", "A long unique passphrase plus two-factor authentication", "Sharing codes with support staff", "Writing the password on a sticky note"]',1,'Unique passphrases and a second factor stop most account takeovers.','Cybersecurity','intermediate',10,5);
  end if;
  select id into c from tech_challenges where slug='case-code-detective';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'This program crashes. Why?
```
def add(a, b):
    return a + b

print(add(2))
```','["add() is called with a missing argument", "return cannot add numbers", "print is misspelled", "Functions need two return statements"]',0,'add() needs two arguments but receives one, which raises a TypeError.','Programming','beginner',10,1),
    (c,'Python reports a syntax error. What is the bug?
```
for i in range(5)
    print(i)
```','["range cannot take 5", "A colon is missing after the for line", "print needs two arguments", "i must be declared first"]',1,'Python needs a colon at the end of a for statement.','Programming','beginner',10,2),
    (c,'The code should print 6 but prints 3. Why?
```
total = 0
for n in [1, 2, 3]:
    total = n
print(total)
```','["The list is too short", "total is overwritten instead of added to (use +=)", "print runs too early", "range is missing"]',1,'total = n replaces the value each time; total += n accumulates it.','Problem Solving','intermediate',10,3),
    (c,'Spot the bug:
```
x = 4
if x = 5:
    print("five")
```','["= assigns a value; comparison needs ==", "x cannot be 4", "print needs brackets", "if needs two conditions"]',0,'A single = assigns. Use == to compare.','Programming','beginner',10,4);
  end if;
  select id into c from tech_challenges where slug='case-web-detective';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Visitors say the page text is hard to read. The text is light grey (#CCCCCC) on a white background. What is the problem?','["Low colour contrast", "The font is too large", "The page loads too fast", "The images are missing"]',0,'Low contrast makes text hard to read, especially for people with visual impairments.','Web','beginner',10,1),
    (c,'A screen reader announces nothing for the logo.
```
<img src="logo.png">
```
What is missing?','["A width attribute", "An alt attribute describing the image", "A closing </img> tag", "A CSS class"]',1,'Alt text describes images to assistive technology and appears if the image fails to load.','Web','beginner',10,2),
    (c,'On phones the page looks tiny and zoomed out, but on desktop it is fine. What is the most likely cause?','["The viewport meta tag is missing", "The server is too slow", "The images are too sharp", "The title is too long"]',0,'Without <meta name="viewport" ...> mobile browsers render a desktop-width layout.','Web','intermediate',10,3),
    (c,'The button does nothing when clicked.
```
<button onclick="sayHi">Hi</button>
```','["onclick must be uppercase", "The function is referenced but never called — it needs sayHi()", "Buttons cannot run code", "The text must be inside quotes"]',1,'sayHi is only a reference; sayHi() actually runs the function.','Programming','intermediate',10,4);
  end if;
  select id into c from tech_challenges where slug='case-sql-detective';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Why does this fail?
```
SELECT * FROM students WHERE name = Ada;
```','["Ada is text and needs quotes", "SELECT * is not allowed", "students must be uppercase", "WHERE cannot use ="]',0,'Text values must be quoted: name = ''Ada''.','Databases','beginner',10,1),
    (c,'This should show orders per customer but errors.
```
SELECT customer, COUNT(*) FROM orders;
```','["COUNT cannot be used with SELECT", "A GROUP BY customer clause is missing", "orders needs an alias", "customer must be a number"]',1,'Non-aggregated columns used with COUNT require GROUP BY.','Databases','intermediate',10,2),
    (c,'A developer wanted to delete one customer but ran:
```
DELETE FROM customers;
```
What happens?','["Only the newest customer is deleted", "Every customer is deleted — the WHERE clause is missing", "Nothing, DELETE needs SELECT", "The table structure is removed"]',1,'Without WHERE, DELETE affects every row.','Databases','intermediate',10,3),
    (c,'Why does this fail?
```
SELECT name FROM students
ORDER BY score DESC
WHERE score > 50;
```','["ORDER BY must come after WHERE", "score cannot be sorted", "DESC is invalid", "name must be in brackets"]',0,'Clause order matters: SELECT, FROM, WHERE, then ORDER BY.','Databases','beginner',10,4);
  end if;
  select id into c from tech_challenges where slug='case-cyber-detective';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'An email says: “Your account closes in 1 hour! Verify now: bit.ly/x9-verify”. What is this most likely?','["A routine bank notice", "A phishing attempt", "A software update", "A newsletter"]',1,'Urgency plus a shortened link is a classic phishing pattern.','Cybersecurity','beginner',10,1),
    (c,'Logs show 20 failed logins at 3 a.m. from a new country, then one success. What is the best immediate response?','["Ignore it — it eventually succeeded", "Reset the password, sign out all sessions and enable two-factor authentication", "Delete the logs", "Email the password to the user"]',1,'Repeated failures then success suggests brute-forcing; secure the account immediately.','Cybersecurity','intermediate',10,2),
    (c,'You find an unlabelled USB drive in the car park. What should you do?','["Plug it in to find the owner", "Hand it to IT/security without plugging it in", "Share it with colleagues", "Format it and keep it"]',1,'Unknown USB devices can carry malware; never plug them in.','Cybersecurity','beginner',10,3),
    (c,'A login page at http://aptech-login.example.xyz asks for your card details and shows no padlock. What is wrong?','["Nothing, this is normal", "It looks like a fake, insecure site — leave without entering details", "The padlock is optional for payments", "You should try a different browser"]',1,'Unexpected domain, no HTTPS and a card request are all red flags.','Cybersecurity','beginner',10,4);
  end if;
  select id into c from tech_challenges where slug='data-detective-sales';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Which month performed best overall?','["Mar", "May", "Jun", "Jan"]',1,'May had the highest total: ₦510,000.','Data','beginner',10,1),
    (c,'Which category performed better across the six months?','["Phones", "Accessories", "They are equal", "Cannot be known"]',0,'Phones total ₦1,460,000 versus accessories ₦890,000.','Data','beginner',10,2),
    (c,'What was the combined total for January to March?','["₦890,000", "₦980,000", "₦1,080,000", "₦930,000"]',1,'250,000 + 310,000 + 420,000 = 980,000.','Data','intermediate',10,3),
    (c,'Which month had the biggest drop compared with the month before?','["Apr", "Jun", "Feb", "Mar"]',1,'June fell by ₦40,000 from May; April fell by ₦30,000.','Data','intermediate',10,4),
    (c,'What is the most reasonable conclusion?','["Sales are falling every month", "Sales trend upward overall, with small dips in April and June", "Accessories sell more than phones", "Nothing can be concluded from six months"]',1,'Despite two dips, the overall direction from Jan to Jun is upward.','Data','intermediate',10,5);
  end if;
  select id into c from tech_challenges where slug='tech-iq-speed-round';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Which language styles a webpage?','["CSS", "SQL", "Python", "Bash"]',0,'CSS controls presentation.','Web','beginner',10,1),
    (c,'What does SQL stand for?','["Structured Query Language", "Simple Quick Logic", "System Query Layer", "Stored Question List"]',0,'SQL is the Structured Query Language.','Databases','beginner',10,2),
    (c,'Which is a loop keyword in most languages?','["for", "if", "else", "return"]',0,'for repeats a block.','Programming','beginner',10,3),
    (c,'What does HTTPS add over HTTP?','["Encryption", "Faster images", "More colours", "Bigger pages"]',0,'HTTPS encrypts traffic between browser and server.','Cybersecurity','beginner',10,4),
    (c,'Which function adds a range of cells in Excel?','["SUM", "JOIN", "ADDALL", "TOTALIZE"]',0,'SUM adds values in a range.','Data','beginner',10,5),
    (c,'What is a primary key?','["A unique identifier for a row", "A password", "The first column alphabetically", "A backup copy"]',0,'Primary keys uniquely identify records.','Databases','beginner',10,6),
    (c,'2 + 2 * 3 equals?','["12", "8", "10", "6"]',1,'Multiplication happens first: 2 + 6 = 8.','Problem Solving','beginner',10,7),
    (c,'Which is an example of two-factor authentication?','["Password + SMS code", "Two passwords", "Username + email", "Password + username"]',0,'Two different kinds of proof are required.','Cybersecurity','beginner',10,8),
    (c,'Which HTML tag creates a hyperlink?','["<a>", "<p>", "<img>", "<div>"]',0,'<a> is the anchor element.','Web','beginner',10,9),
    (c,'Which is NOT a programming language?','["Python", "Java", "HTML", "JavaScript"]',2,'HTML is a markup language, not a programming language.','Programming','intermediate',10,10),
    (c,'What chart best shows change over time?','["Line chart", "Pie chart of one slice", "Scatter of names", "Word list"]',0,'Line charts show trends over time.','Data','beginner',10,11),
    (c,'What does RAM do?','["Holds data the computer is actively using", "Stores files permanently", "Cools the CPU", "Connects to Wi-Fi"]',0,'RAM is fast, temporary working memory.','Technology Fundamentals','beginner',10,12),
    (c,'What does a firewall do?','["Filters network traffic", "Writes code", "Edits photos", "Compresses videos"]',0,'Firewalls allow or block traffic by rule.','Cybersecurity','beginner',10,13),
    (c,'What does `10 % 3` return in most languages?','["1", "3", "0", "3.33"]',0,'% gives the remainder: 10 ÷ 3 leaves 1.','Programming','intermediate',10,14),
    (c,'Which SQL keyword removes duplicate rows from results?','["DISTINCT", "UNIQUE ROWS", "CLEAN", "SINGLE"]',0,'SELECT DISTINCT returns unique values.','Databases','intermediate',10,15),
    (c,'Which is the best first step when something fails to work?','["Read the error message", "Restart randomly", "Delete everything", "Ignore it"]',0,'Error messages usually point to the cause.','Problem Solving','beginner',10,16),
    (c,'What is cloud storage?','["Files stored on remote servers over the internet", "A weather app", "Storage inside a USB port", "A type of keyboard"]',0,'Cloud storage keeps files on internet-accessible servers.','Digital Skills','beginner',10,17),
    (c,'Responsive design means a site...','["Adapts to different screen sizes", "Replies to emails", "Loads only on desktop", "Has animations"]',0,'Responsive layouts adapt to the device.','Web','beginner',10,18),
    (c,'Which is an average of 2, 4 and 9?','["5", "6", "4.5", "15"]',0,'(2+4+9)/3 = 5.','Data','intermediate',10,19),
    (c,'A bug is...','["An error in a program", "A virus scanner", "A type of network", "A backup"]',0,'A bug is a flaw that causes unexpected behaviour.','Programming','beginner',10,20);
  end if;
  select id into c from tech_challenges where slug='streak-day-1';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Which is the best way to keep many passwords safe?','["A reputable password manager", "One shared spreadsheet", "Sticky notes", "Reusing one password"]',0,'Password managers generate and store unique passwords.','Digital Skills','beginner',10,1),
    (c,'Which file type is usually a spreadsheet?','[".xlsx", ".mp3", ".exe", ".png"]',0,'.xlsx is the Excel workbook format.','Digital Skills','beginner',10,2),
    (c,'What does “the cloud” mean in everyday use?','["Servers you reach over the internet", "A weather forecast", "A type of battery", "Offline storage only"]',0,'Cloud services run on remote servers.','Digital Skills','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-2';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'A variable is...','["A named place to store a value", "A kind of error", "A type of monitor", "A website"]',0,'Variables hold data for later use.','Programming','beginner',10,1),
    (c,'What does an if statement do?','["Runs code only when a condition is true", "Repeats forever", "Deletes a file", "Prints a page"]',0,'if makes decisions.','Programming','beginner',10,2),
    (c,'Which result does `3 > 2` produce?','["True", "False", "3", "Error"]',0,'The comparison is true.','Programming','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-3';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'The average of 2, 4 and 6 is...','["4", "6", "3", "12"]',0,'12 ÷ 3 = 4.','Data','beginner',10,1),
    (c,'Which chart best compares sales across products?','["Bar chart", "Random shapes", "A paragraph", "A map of Africa"]',0,'Bar charts compare categories.','Data','beginner',10,2),
    (c,'Which Excel function counts numbers in a range?','["COUNT", "ADDALL", "SUMTEXT", "LISTNUM"]',0,'COUNT counts numeric cells.','Data','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-4';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Which tag holds the biggest heading?','["<h1>", "<p>", "<small>", "<title>"]',0,'<h1> is the top-level heading.','Web','beginner',10,1),
    (c,'CSS is used to...','["Style how a page looks", "Store data", "Send emails", "Encrypt files"]',0,'CSS handles presentation.','Web','beginner',10,2),
    (c,'A link to another page uses which attribute?','["href", "src", "alt", "class"]',0,'href holds the link destination.','Web','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-5';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'A table row represents...','["One record", "The whole database", "A password", "A column heading"]',0,'Rows hold individual records.','Databases','beginner',10,1),
    (c,'Which command reads data?','["SELECT", "MAKE", "FETCHALL", "SHOWROWS"]',0,'SELECT retrieves rows.','Databases','beginner',10,2),
    (c,'A primary key should be...','["Unique for each row", "The same for every row", "Empty", "Random text"]',0,'Primary keys are unique identifiers.','Databases','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-6';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Phishing tries to...','["Trick you into revealing information", "Speed up the Internet", "Back up files", "Update software"]',0,'Phishing is deception.','Cybersecurity','beginner',10,1),
    (c,'Two-factor authentication means...','["Two kinds of proof to log in", "Two passwords of the same kind", "Two users", "Two devices"]',0,'Combines something you know with something you have.','Cybersecurity','beginner',10,2),
    (c,'Why install software updates?','["They fix security flaws", "They change your wallpaper", "They slow phones down", "They delete files"]',0,'Updates patch known vulnerabilities.','Cybersecurity','beginner',10,3);
  end if;
  select id into c from tech_challenges where slug='streak-day-7';
  if c is not null and not exists (select 1 from tech_challenge_questions where challenge_id=c) then
    insert into tech_challenge_questions(challenge_id,question,options,correct_answer,explanation,skill_area,difficulty,points,sort_order) values
    (c,'Which pairing is correct?','["HTML structures a page; SQL queries databases", "SQL styles a page; HTML queries databases", "CSS stores data; HTML encrypts", "Python draws hardware"]',0,'HTML gives structure; SQL queries databases.','Technology Fundamentals','beginner',10,1),
    (c,'What is the best response to an unexpected “verify your account” link?','["Do not click; go to the official site directly", "Click quickly", "Forward it to everyone", "Reply with your password"]',0,'Go to the official site yourself.','Technology Fundamentals','beginner',10,2),
    (c,'Which loop output is correct?
```
for i in range(2):
    print(i)
```','["0 1", "1 2", "0 1 2", "2 1"]',0,'range(2) yields 0 and 1.','Technology Fundamentals','beginner',10,3),
    (c,'A chart shows sales rising each month. This is...','["An upward trend", "Random noise", "A decline", "A bug"]',0,'Consistent increases form an upward trend.','Technology Fundamentals','beginner',10,4),
    (c,'Which is a primary key example?','["Student ID", "City", "First name", "Course"]',0,'IDs are unique per student.','Technology Fundamentals','beginner',10,5);
  end if;
end $$;
