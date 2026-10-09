-- APTECH Abeokuta: verified student success stories (additive migration 0038)
-- Existing content is deliberately unverified until staff confirm authenticity and permission.
alter table public.testimonials
  add column if not exists story_type text not null default 'testimonial'
    check (story_type in ('testimonial','student_project','graduate_experience','employer_outcome','certification_outcome')),
  add column if not exists project_title text,
  add column if not exists story_summary text,
  add column if not exists programme_slug text,
  add column if not exists consent_confirmed boolean not null default false,
  add column if not exists consent_confirmed_at timestamptz,
  add column if not exists verified_by uuid references public.staff(id) on delete set null,
  add column if not exists verified_at timestamptz;

-- Fail closed: pre-existing rows are not publicly displayed until reviewed.
update public.testimonials set is_published = false, consent_confirmed = false;
create index if not exists idx_testimonials_verified_public
  on public.testimonials (is_published, consent_confirmed, story_type);
