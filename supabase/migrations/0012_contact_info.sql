-- ============================================================================
-- APTECH Abeokuta — Contact info CMS
-- Migration 0012: one singleton table, seeded from the values previously
-- hardcoded in data/site.ts (siteConfig.phone/whatsapp/email/address/hours).
--
-- Same singleton shape as partners_highlight (migration 0011): there is only
-- ever meant to be one row. The admin form always upserts whichever row
-- exists (see app/admin/(dashboard)/settings/contact/actions.ts).
-- ============================================================================

create table contact_info (
  id uuid primary key default gen_random_uuid(),

  phone text not null,
  whatsapp text not null,
  email text not null,
  address text not null,

  -- Office hours rows, in display order: [{ "day": "Monday – Friday", "time": "9:00 AM – 5:00 PM" }, ...].
  -- A jsonb array rather than a child table since this is only ever edited
  -- as a whole block from a single form (see ContactInfoForm.tsx), same
  -- reasoning as `points` on partner_organizations (migration 0011).
  hours jsonb not null default '[]'::jsonb,

  updated_by uuid references staff (id) on delete set null,
  updated_at timestamptz not null default now(),

  constraint contact_info_phone_length check (char_length(phone) between 1 and 40),
  constraint contact_info_whatsapp_length check (char_length(whatsapp) between 1 and 40),
  constraint contact_info_email_length check (char_length(email) between 1 and 200),
  constraint contact_info_address_length check (char_length(address) between 1 and 500)
);

create trigger trg_contact_info_updated_at before update on contact_info
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — same model as partners_highlight: active staff can
-- SELECT; every write goes through the service-role client in
-- app/admin/(dashboard)/settings/contact/actions.ts. Public reads use the
-- service-role client from lib/contact-info-public.ts (no is_published
-- gate here, unlike marketing content — contact info is core information
-- every page needs, not something that gets toggled on/off; the public
-- fetcher falls back to sane defaults if this table is ever unreadable).
-- ----------------------------------------------------------------------------

alter table contact_info enable row level security;

create policy "contact_info_select_staff" on contact_info
  for select using (is_active_staff());

insert into contact_info (phone, whatsapp, email, address, hours)
values (
  '+234 (0) 803 415 2557',
  '+234 (0) 803 415 2557',
  'aptech.abeokuta@gmail.com',
  '#22 Quarry Road, Old Savannah Bank Building, Panseke, Ibara, Abeokuta',
  '[
    {"day": "Monday – Friday", "time": "9:00 AM – 5:00 PM"},
    {"day": "Saturday", "time": "10:00 AM – 2:00 PM"},
    {"day": "Sunday", "time": "Closed"}
  ]'::jsonb
)
on conflict do nothing;
