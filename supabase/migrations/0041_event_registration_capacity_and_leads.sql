-- ============================================================================
-- APTECH Abeokuta: event registration, capacity enforcement and CRM leads
--
-- 1. lead_consents may now be recorded from the events form.
-- 2. register_for_campus_event(): one atomic, race-free registration. It locks
--    the event row, enforces capacity, refuses (never overwrites) a duplicate
--    registration, finds-or-creates the CRM lead and logs a timeline entry.
-- 3. campus_event_registration_counts(): per-event totals (no personal data)
--    so the public page can show "N places left" / "Fully booked".
-- Both functions are callable by the service role only.
-- ============================================================================

alter table public.lead_consents drop constraint if exists lead_consents_form_source_check;
alter table public.lead_consents
  add constraint lead_consents_form_source_check
  check (form_source in ('admissions', 'contact', 'career_quiz', 'tech_zone', 'event'));

create index if not exists idx_event_registrations_email on public.event_registrations (lower(email));
create index if not exists idx_event_registrations_lead on public.event_registrations (lead_id);

create or replace function public.register_for_campus_event(
  p_event_id uuid,
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_interest text default 'general',
  p_preferred_contact text default 'email',
  p_marketing_consent boolean default false
)
returns table (
  o_outcome text,
  o_registration_id uuid,
  o_lead_id uuid,
  o_lead_reference text,
  o_is_new_lead boolean,
  o_spots_left integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.campus_events%rowtype;
  v_existing public.event_registrations%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_name text := trim(coalesce(p_full_name, ''));
  v_taken integer;
  v_lead_id uuid;
  v_lead_reference text;
  v_new_lead boolean := false;
  v_first text;
  v_last text;
  v_suffix text;
  v_registration_id uuid;
  v_spots integer;
begin
  if v_name = '' then raise exception 'Name is required'; end if;
  if v_email = '' then raise exception 'Email is required'; end if;

  -- Serialise registrations for this event so capacity can never be overbooked.
  select * into v_event from public.campus_events where id = p_event_id for update;

  if not found or not v_event.registration_open or v_event.starts_at <= now() then
    return query select 'closed'::text, null::uuid, null::uuid, null::text, false, null::integer;
    return;
  end if;

  select count(*)::integer into v_taken
  from public.event_registrations r
  where r.event_id = p_event_id and r.attendance_status <> 'cancelled';

  select * into v_existing
  from public.event_registrations r
  where r.event_id = p_event_id and lower(r.email) = v_email;

  if found and v_existing.attendance_status <> 'cancelled' then
    -- Already registered: report it, change nothing (no consent/contact overwrite).
    return query select
      'already_registered'::text, v_existing.id, v_existing.lead_id, null::text, false,
      case when v_event.capacity is null then null else greatest(v_event.capacity - v_taken, 0) end;
    return;
  end if;

  if v_event.capacity is not null and v_taken >= v_event.capacity then
    return query select 'full'::text, null::uuid, null::uuid, null::text, false, 0;
    return;
  end if;

  -- Find or create the CRM lead (one profile per person, matched on email).
  select l.id, l.lead_reference into v_lead_id, v_lead_reference
  from public.leads l
  where lower(l.email) = v_email
  order by l.created_at desc
  limit 1;

  if v_lead_id is null then
    v_first := split_part(v_name, ' ', 1);
    v_last := coalesce(nullif(trim(substr(v_name, length(v_first) + 1)), ''), '—');
    loop
      v_suffix := lpad(floor(random() * 1000000)::int::text, 6, '0');
      v_lead_reference := 'APE-' || to_char(current_date, 'YYYY') || '-' || v_suffix;
      exit when not exists (select 1 from public.leads l where l.lead_reference = v_lead_reference);
    end loop;

    insert into public.leads (lead_reference, first_name, last_name, email, phone, status, source, landing_page)
    values (v_lead_reference, v_first, v_last, v_email, coalesce(v_phone, 'Not provided'), 'new', 'campus_event', '/events')
    returning id into v_lead_id;
    v_new_lead := true;
  elsif v_phone is not null then
    update public.leads set phone = v_phone where id = v_lead_id and phone = 'Not provided';
  end if;

  if v_existing.id is not null then
    -- Re-registering after a cancellation: reuse the row.
    update public.event_registrations
       set attendance_status = 'registered', lead_id = v_lead_id, full_name = v_name,
           phone = coalesce(v_phone, phone), interest = coalesce(nullif(p_interest, ''), 'general'),
           preferred_contact = coalesce(nullif(p_preferred_contact, ''), 'email'),
           marketing_consent = coalesce(p_marketing_consent, false),
           registration_consent = true, registered_at = now(), updated_at = now()
     where id = v_existing.id
     returning id into v_registration_id;
  else
    insert into public.event_registrations (
      event_id, lead_id, full_name, email, phone, interest, registration_consent, marketing_consent, preferred_contact
    ) values (
      p_event_id, v_lead_id, v_name, v_email, v_phone, coalesce(nullif(p_interest, ''), 'general'), true,
      coalesce(p_marketing_consent, false), coalesce(nullif(p_preferred_contact, ''), 'email')
    )
    returning id into v_registration_id;
  end if;

  insert into public.interactions (lead_id, user_id, type, subject, description)
  values (
    v_lead_id, null, 'website', 'Registered for event: ' || v_event.title,
    'Registered for "' || v_event.title || '" on ' ||
      to_char(v_event.starts_at at time zone 'Africa/Lagos', 'DD Mon YYYY HH24:MI') ||
      ' WAT. Interest: ' || coalesce(nullif(p_interest, ''), 'general') || '.'
  );

  v_spots := case when v_event.capacity is null then null else greatest(v_event.capacity - (v_taken + 1), 0) end;

  return query select 'registered'::text, v_registration_id, v_lead_id, v_lead_reference, v_new_lead, v_spots;
end;
$$;

revoke all on function public.register_for_campus_event(uuid, text, text, text, text, text, boolean) from public;
revoke all on function public.register_for_campus_event(uuid, text, text, text, text, text, boolean) from anon;
revoke all on function public.register_for_campus_event(uuid, text, text, text, text, text, boolean) from authenticated;
grant execute on function public.register_for_campus_event(uuid, text, text, text, text, text, boolean) to service_role;

create or replace function public.campus_event_registration_counts()
returns table (o_event_id uuid, o_registered_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*)
  from public.event_registrations r
  join public.campus_events e on e.id = r.event_id
  where r.attendance_status <> 'cancelled' and e.starts_at > now() - interval '1 day'
  group by r.event_id;
$$;

revoke all on function public.campus_event_registration_counts() from public;
revoke all on function public.campus_event_registration_counts() from anon;
revoke all on function public.campus_event_registration_counts() from authenticated;
grant execute on function public.campus_event_registration_counts() to service_role;
