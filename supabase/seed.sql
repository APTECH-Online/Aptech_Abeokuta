-- ============================================================================
-- APTECH Abeokuta — seed data
-- Run after 0001_init.sql. Safe to re-run (upserts on unique `code`).
-- ============================================================================

insert into programmes (name, code, description, duration, status, display_order)
values
  (
    'Advanced Diploma in Software Engineering',
    'ADSE',
    'A flagship, project-based programme covering the full software development lifecycle — from programming fundamentals through databases, web and cloud.',
    '18–24 months',
    'active',
    1
  ),
  (
    'Smart Professional Programmes',
    'SMARTPRO',
    'Short, focused professional certification tracks in high-demand digital and IT skills.',
    '3–6 months',
    'active',
    2
  ),
  (
    'Aptech Certified Network Specialist',
    'ACNS',
    'Hands-on networking and systems administration training, from fundamentals through enterprise infrastructure.',
    '6–9 months',
    'active',
    3
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  duration = excluded.duration,
  display_order = excluded.display_order;

-- ----------------------------------------------------------------------------
-- To create your first Super Admin, after inviting/creating the user in
-- Supabase Auth (Dashboard → Authentication → Users → Add user), run:
--
--   insert into staff (id, full_name, email, role, is_active)
--   values ('<auth-user-uuid>', 'Full Name', 'name@aptechabeokuta.com', 'super_admin', true);
-- ----------------------------------------------------------------------------
