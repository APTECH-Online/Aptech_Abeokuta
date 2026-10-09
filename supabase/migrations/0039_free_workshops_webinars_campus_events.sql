-- Free workshops, webinars and campus events, with consent and post-event task automation.
create table if not exists public.campus_events (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 event_type text not null check(event_type in ('coding_workshop','webinar','career_talk','demonstration','open_day','campus_event')),
 description text not null default '', starts_at timestamptz not null, ends_at timestamptz,
 location text not null default 'APTECH Abeokuta', delivery_mode text not null default 'in_person' check(delivery_mode in ('in_person','online','hybrid')),
 meeting_url text, programme_id uuid references public.programmes(id) on delete set null,
 capacity integer check(capacity is null or capacity > 0), registration_open boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_campus_events_upcoming on public.campus_events(registration_open,starts_at);
create table if not exists public.event_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.campus_events(id) on delete cascade,
 lead_id uuid references public.leads(id) on delete set null, full_name text not null, email text not null, phone text,
 interest text not null default 'general', registration_consent boolean not null default false check(registration_consent),
 marketing_consent boolean not null default false, preferred_contact text not null default 'email' check(preferred_contact in ('email','phone','whatsapp','none')),
 attendance_status text not null default 'registered' check(attendance_status in ('registered','attended','no_show','cancelled')),
 inquiry_outcome text not null default 'not_recorded' check(inquiry_outcome in ('not_recorded','interested','requested_counselling','application_started','not_interested','no_follow_up_needed')),
 notes text, registered_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,email)
);
create index if not exists idx_event_registrations_event on public.event_registrations(event_id,attendance_status);
create table if not exists public.event_follow_up_tasks (
 id uuid primary key default gen_random_uuid(), registration_id uuid not null references public.event_registrations(id) on delete cascade,
 lead_id uuid references public.leads(id) on delete set null, task_type text not null check(task_type in ('attendance_follow_up','interested_prospect','counselling_request','no_show_follow_up')),
 title text not null, due_at timestamptz not null default now(), status text not null default 'pending' check(status in ('pending','completed','cancelled')),
 created_at timestamptz not null default now(), unique(registration_id,task_type)
);
alter table public.campus_events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_follow_up_tasks enable row level security;
drop policy if exists campus_events_public_read on public.campus_events;
create policy campus_events_public_read on public.campus_events for select using (registration_open = true and starts_at > now() - interval '1 day');
drop policy if exists campus_events_staff_manage on public.campus_events;
create policy campus_events_staff_manage on public.campus_events for all using (is_active_staff()) with check (is_active_staff());
drop policy if exists event_registrations_staff_manage on public.event_registrations;
create policy event_registrations_staff_manage on public.event_registrations for all using (is_active_staff()) with check (is_active_staff());
drop policy if exists event_follow_up_tasks_staff_manage on public.event_follow_up_tasks;
create policy event_follow_up_tasks_staff_manage on public.event_follow_up_tasks for all using (is_active_staff()) with check (is_active_staff());
create or replace function public.create_event_follow_up_tasks() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.attendance_status in ('attended','no_show') then
  insert into public.event_follow_up_tasks(registration_id,lead_id,task_type,title,due_at)
  values(new.id,new.lead_id,case when new.attendance_status='attended' then 'attendance_follow_up' else 'no_show_follow_up' end,
   case when new.attendance_status='attended' then 'Follow up after event: confirm interests and next steps' else 'Follow up with event registrant who did not attend' end,now()+interval '1 day') on conflict(registration_id,task_type) do nothing;
 end if;
 if new.inquiry_outcome='requested_counselling' then
  insert into public.event_follow_up_tasks(registration_id,lead_id,task_type,title,due_at) values(new.id,new.lead_id,'counselling_request','Contact event prospect to arrange counselling',now()+interval '4 hours') on conflict(registration_id,task_type) do nothing;
 elsif new.inquiry_outcome='interested' then
  insert into public.event_follow_up_tasks(registration_id,lead_id,task_type,title,due_at) values(new.id,new.lead_id,'interested_prospect','Follow up with interested event prospect',now()+interval '1 day') on conflict(registration_id,task_type) do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists trg_create_event_follow_up_tasks on public.event_registrations;
create trigger trg_create_event_follow_up_tasks after insert or update of attendance_status,inquiry_outcome on public.event_registrations for each row execute function public.create_event_follow_up_tasks();
