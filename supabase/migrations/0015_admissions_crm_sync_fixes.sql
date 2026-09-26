-- ============================================================================
-- APTECH Abeokuta — Admissions ↔ CRM sync audit fixes
-- Migration 0015
--
-- Fixes found while auditing the /admissions → CRM pipeline end to end:
--
-- 1. Migration 0014 (RBAC) tightened `staff` SELECT to "self or super admin
--    only". That broke every staff-name join used across the CRM (assigned
--    staff on leads/applications/follow-ups, the "who logged this" actor on
--    interactions, and the staff dropdowns used to assign leads/follow-ups
--    and pick an insights author) for every non-super-admin role. Those
--    pages ran with the visitor's own session (RLS-enforced), not the
--    service-role key, so the joins silently came back null instead of
--    erroring. This restores directory-style read access (id/full_name/role
--    are not sensitive) to every active staff member; management
--    (insert/update/delete) is still service-role-only, unaffected by this.
--
-- 2. The same migration restricted `programmes` SELECT to super admins only.
--    Admissions Officers legitimately need to read programme names — the
--    Leads list, Applications list, and a lead's "Start application" picker
--    all join/read `programmes` under the visitor's own session — so those
--    screens were rendering blank programme names / an empty programme
--    picker for the Admissions Officer role. This adds admissions_officer
--    to the programmes SELECT policy. Programme management (create/edit)
--    remains super-admin-only at the application layer (see canManageProgrammes
--    in lib/auth.ts), which this does not change.
--
-- 3. The public Contact form treated phone number as optional end to end
--    (frontend, zod schema, and this RPC), storing a literal "Not provided"
--    placeholder in the CRM. Phone is now required at every layer; this
--    updates the RPC to reject a missing/blank phone number the same way it
--    already rejects a missing name/email/message.
--
-- 4. Nothing at the database layer stopped the same lead from being pushed
--    into the same programme's application pipeline twice (double form
--    submits, a staff member clicking "Start application" twice, or a race
--    between two requests). The server action now checks for an existing
--    active application first; this partial unique index is the
--    defense-in-depth backstop for the concurrent case. Withdrawn/rejected
--    applications don't count, since re-applying after either is legitimate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Restore staff-directory read access for every active staff member.
-- ----------------------------------------------------------------------------

drop policy if exists "staff_select_self_or_super_admin" on staff;
create policy "staff_select_active_staff" on staff
  for select using (is_active_staff());

-- ----------------------------------------------------------------------------
-- 2. Let Admissions Officers read programme names (select only).
-- ----------------------------------------------------------------------------

drop policy if exists "programmes_select_super_admin" on programmes;
create policy "programmes_select_admissions_or_super_admin" on programmes
  for select using (current_staff_role() in ('super_admin', 'admissions_officer'));

-- ----------------------------------------------------------------------------
-- 3. Require a phone number on the public contact form RPC.
-- ----------------------------------------------------------------------------

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

  if v_phone is null then
    raise exception 'Phone number is required';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Message is required';
  end if;

  v_first_name := split_part(trim(p_name), ' ', 1);
  v_last_name := nullif(trim(substr(trim(p_name), length(v_first_name) + 1)), '');
  v_last_name := coalesce(v_last_name, '—');

  -- Keep one CRM profile per person. Email is the primary match.
  select l.id, l.lead_reference
    into v_lead_id, v_lead_reference
  from public.leads l
  where lower(l.email) = lower(trim(p_email))
  order by l.created_at desc
  limit 1;

  if v_lead_id is not null then
    v_duplicate := true;

    -- Refresh the phone number in case it changed, without touching
    -- CRM-managed fields (status, assignment, etc).
    update public.leads
    set phone = v_phone
    where id = v_lead_id;
  else
    -- Generate a collision-resistant reference without relying on row counts.
    loop
      v_suffix := lpad(floor(random() * 1000000)::int::text, 6, '0');
      v_lead_reference := 'APC-' || v_year || '-' || v_suffix;
      exit when not exists (
        select 1 from public.leads l where l.lead_reference = v_lead_reference
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
      v_phone,
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

revoke all on function public.submit_contact_form(text, text, text, text, text, text) from public;
revoke all on function public.submit_contact_form(text, text, text, text, text, text) from anon;
revoke all on function public.submit_contact_form(text, text, text, text, text, text) from authenticated;
grant execute on function public.submit_contact_form(text, text, text, text, text, text) to service_role;

-- ----------------------------------------------------------------------------
-- 4. Prevent duplicate active applications for the same lead + programme.
-- ----------------------------------------------------------------------------

create unique index if not exists idx_applications_lead_programme_active
  on applications (lead_id, programme_id)
  where status not in ('withdrawn', 'rejected');
