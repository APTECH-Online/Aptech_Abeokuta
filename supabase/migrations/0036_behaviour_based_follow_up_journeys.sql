-- Behaviour-based admissions follow-up journeys.
-- This migration stores journey rules and auditable per-lead enrolments. Sending is
-- deliberately gated by explicit marketing consent and communication preference.

create table if not exists public.follow_up_journeys (
  id uuid primary key default gen_random_uuid(),
  journey_key text not null unique,
  name text not null,
  description text not null default '',
  trigger_event text not null,
  recommended_channel text not null default 'email' check (recommended_channel in ('email','whatsapp','phone','manual')),
  delay_minutes integer not null default 1440 check (delay_minutes >= 0),
  message_template text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_up_journey_enrolments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.follow_up_journeys(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','sent','completed','paused','suppressed','cancelled')),
  due_at timestamptz not null default now(),
  channel text not null check (channel in ('email','whatsapp','phone','manual')),
  suppression_reason text,
  source_event text,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journey_id, lead_id)
);

create index if not exists idx_follow_up_journeys_active on public.follow_up_journeys(is_active, journey_key);
create index if not exists idx_follow_up_journey_queue on public.follow_up_journey_enrolments(status, due_at);
create index if not exists idx_follow_up_journey_lead on public.follow_up_journey_enrolments(lead_id, created_at desc);

alter table public.follow_up_journeys enable row level security;
alter table public.follow_up_journey_enrolments enable row level security;

drop policy if exists follow_up_journeys_staff_manage on public.follow_up_journeys;
create policy follow_up_journeys_staff_manage on public.follow_up_journeys
  for all using (is_active_staff()) with check (is_active_staff());
drop policy if exists follow_up_journey_enrolments_staff_manage on public.follow_up_journey_enrolments;
create policy follow_up_journey_enrolments_staff_manage on public.follow_up_journey_enrolments
  for all using (is_active_staff()) with check (is_active_staff());

insert into public.follow_up_journeys (journey_key,name,description,trigger_event,recommended_channel,delay_minutes,message_template) values
('application_abandoned','Application started, not completed','Help prospects resume an incomplete application without pressure.','application_started','email',1440,'Hi {{first_name}}, you can continue your Aptech Abeokuta application whenever you are ready. Need help? Reply and our admissions team will assist.'),
('fees_no_counselling','Fees asked, no counselling booked','Offer a clear fee explanation and an optional counselling appointment.','fee_inquiry','whatsapp',240,'Hi {{first_name}}, thanks for asking about programme fees. If useful, you can book a counselling session to discuss fees and payment options: {{booking_url}}'),
('tech_zone_no_guidance','Tech Zone completed, no guidance requested','Connect challenge interest to a relevant learning pathway.','challenge_completed','email',1440,'Hi {{first_name}}, well done on completing the Tech Zone challenge. Would you like guidance on programmes that match your interests? {{guidance_url}}'),
('counselling_no_application','Counselling attended, no application','Provide a supportive next step after counselling.','counselling_attended','email',2880,'Hi {{first_name}}, thank you for speaking with our team. If you are ready, you can start your application here: {{application_url}}. Reply if you still have questions.'),
('inquiry_no_response','Inquiry awaiting response','Flag unanswered enquiries for staff follow-up before any prospect message is sent.','inquiry_submitted_unanswered','manual',60,'Staff task: review this enquiry and send a relevant response using the prospect’s permitted communication channel.')
on conflict (journey_key) do update set name=excluded.name,description=excluded.description,trigger_event=excluded.trigger_event,recommended_channel=excluded.recommended_channel,delay_minutes=excluded.delay_minutes,message_template=excluded.message_template,updated_at=now();

comment on table public.follow_up_journey_enrolments is 'Auditable follow-up queue. Any automated send must re-check marketing_opt_in, consent records, preference, and suppression/opt-out state immediately before sending.';
