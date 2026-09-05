-- ============================================================================
-- APTECH Abeokuta — Public Contact Form → CRM RPC
--
-- The website submits through a Next.js server action using the Supabase
-- secret key. This function makes creation of the lead + website interaction
-- atomic and keeps the database write in one trusted server-side operation.
-- ============================================================================

create or replace function public.submit_contact_form(
  p_name text,
  p_email text,
  p_phone text default null,
  p_subject text default null,
  p_message text default null,
  p_landing_page text default '/contact'
)
returns table (
  lead_id uuid,
  is_duplicate boolean,
  lead_reference text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
  v_last_name text;
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_lead_id uuid;
  v_lead_reference text;
  v_duplicate boolean := false;
  v_year text := to_char(current_date, 'YYYY');
  v_suffix text;
begin
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Name is required';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'Email is required';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Message is required';
  end if;

  v_first_name := split_part(trim(p_name), ' ', 1);
  v_last_name := nullif(trim(substr(trim(p_name), length(v_first_name) + 1)), '');
  v_last_name := coalesce(v_last_name, '—');

  -- Keep one CRM profile per person. Email is the primary match.
  select id, lead_reference
    into v_lead_id, v_lead_reference
  from public.leads
  where lower(email) = lower(trim(p_email))
  order by created_at desc
  limit 1;

  if v_lead_id is not null then
    v_duplicate := true;
  else
    -- Generate a collision-resistant reference without relying on row counts.
    loop
      v_suffix := lpad(floor(random() * 1000000)::int::text, 6, '0');
      v_lead_reference := 'APC-' || v_year || '-' || v_suffix;
      exit when not exists (
        select 1 from public.leads where lead_reference = v_lead_reference
      );
    end loop;

    insert into public.leads (
      lead_reference,
      first_name,
      last_name,
      email,
      phone,
      status,
      source,
      landing_page
    ) values (
      v_lead_reference,
      v_first_name,
      v_last_name,
      lower(trim(p_email)),
      coalesce(v_phone, 'Not provided'),
      'new',
      'website',
      coalesce(nullif(trim(p_landing_page), ''), '/contact')
    )
    returning id into v_lead_id;
  end if;

  insert into public.interactions (
    lead_id,
    user_id,
    type,
    subject,
    description
  ) values (
    v_lead_id,
    null,
    'website',
    coalesce(nullif(trim(p_subject), ''), 'Website contact form'),
    trim(p_message)
  );

  return query
  select v_lead_id, v_duplicate, v_lead_reference;
end;
$$;

-- This function must never be callable directly by anonymous visitors.
revoke all on function public.submit_contact_form(text, text, text, text, text, text) from public;
revoke all on function public.submit_contact_form(text, text, text, text, text, text) from anon;
revoke all on function public.submit_contact_form(text, text, text, text, text, text) from authenticated;
grant execute on function public.submit_contact_form(text, text, text, text, text, text) to service_role;
