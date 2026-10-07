-- APTECH Abeokuta — Phase 6 marketing campaigns & attribution
-- Extends the existing CRM/analytics system. No parallel lead or analytics store.

create type campaign_status as enum ('draft','scheduled','active','paused','completed','archived');
create type campaign_type as enum ('google_search','meta_facebook','instagram','whatsapp','organic_search','email','referral','offline','event','school_outreach','programme_specific','general_admissions','seasonal','custom');
create type campaign_conversion_goal as enum ('enquiry','advisor_request','application','enrollment');

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status campaign_status not null default 'draft',
  campaign_type campaign_type not null default 'custom',
  start_date date,
  end_date date,
  programme_id uuid references public.programmes(id) on delete set null,
  target_audience text,
  target_location text,
  landing_page text,
  primary_cta text,
  conversion_goal campaign_conversion_goal not null default 'enquiry',
  source text,
  medium text,
  campaign_identifier text not null unique,
  headline text,
  opportunity text,
  notes text,
  created_by uuid references public.staff(id) on delete set null,
  updated_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_programme on public.campaigns(programme_id);
create index idx_campaigns_dates on public.campaigns(start_date, end_date);
create index idx_campaigns_identifier on public.campaigns(campaign_identifier);

create trigger trg_campaigns_updated_at before update on public.campaigns
for each row execute function public.set_updated_at();

alter table public.leads
  add column if not exists first_touch_source text,
  add column if not exists first_touch_medium text,
  add column if not exists first_touch_campaign text,
  add column if not exists first_touch_campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists last_touch_source text,
  add column if not exists last_touch_medium text,
  add column if not exists last_touch_campaign text,
  add column if not exists last_touch_campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists conversion_point text,
  add column if not exists attribution_landing_page text,
  add column if not exists attribution_referrer text;

create index idx_leads_first_campaign on public.leads(first_touch_campaign_id);
create index idx_leads_last_campaign on public.leads(last_touch_campaign_id);
create index idx_leads_last_touch_source on public.leads(last_touch_source);

alter table public.campaigns enable row level security;
create policy "campaigns_public_active_select" on public.campaigns
for select to anon, authenticated using (
  status = 'active'
  and (start_date is null or start_date <= current_date)
  and (end_date is null or end_date >= current_date)
);
create policy "campaigns_staff_select" on public.campaigns
for select to authenticated using (is_active_staff());

-- Campaign attribution is represented on the existing lead row; the campaign
-- table is the management layer, not a second CRM.
comment on column public.leads.first_touch_campaign_id is 'Phase 6 first-touch campaign attribution.';
comment on column public.leads.last_touch_campaign_id is 'Phase 6 last-touch campaign attribution.';


alter table public.conversion_events drop constraint if exists conversion_events_event_name_check;
alter table public.conversion_events add constraint conversion_events_event_name_check check (event_name in (
  'career_quiz_started','career_quiz_recommendation_viewed','career_quiz_completed','tech_challenge_started','tech_challenge_completed',
  'comparison_started','comparison_programme_added','comparison_programme_removed','comparison_completed','comparison_cta_clicked',
  'career_pathway_viewed','student_story_viewed','student_project_viewed','advisor_cta_clicked','enquiry_cta_clicked','application_cta_clicked',
  'campaign_landing_viewed','campaign_cta_clicked'
));
