-- Admissions counselling appointments; extends the existing admissions CRM.
CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  appointment_type text NOT NULL CHECK (appointment_type IN ('campus','phone','virtual')),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  notes text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  reminder_sent_at timestamptz,
  cancellation_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_date_status ON public.consultation_bookings (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_email ON public.consultation_bookings (lower(email));
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_reminders ON public.consultation_bookings (appointment_date, appointment_time) WHERE status = 'confirmed' AND reminder_sent_at IS NULL;
-- A slot is held by one confirmed booking; cancelled bookings release it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_consultation_bookings_active_slot
  ON public.consultation_bookings (appointment_date, appointment_time)
  WHERE status = 'confirmed';
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS consultation_bookings_staff_read ON public.consultation_bookings;
CREATE POLICY consultation_bookings_staff_read ON public.consultation_bookings
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = auth.uid() AND s.is_active = true AND (s.role::text IN ('super_admin','admissions_officer') OR COALESCE(s.permissions, '{}'::jsonb) ? 'enquiries.view')));
DROP POLICY IF EXISTS consultation_bookings_staff_update ON public.consultation_bookings;
CREATE POLICY consultation_bookings_staff_update ON public.consultation_bookings
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = auth.uid() AND s.is_active = true AND (s.role::text IN ('super_admin','admissions_officer') OR COALESCE(s.permissions, '{}'::jsonb) ? 'enquiries.update_status' OR COALESCE(s.permissions, '{}'::jsonb) ? 'enquiries.assign')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = auth.uid() AND s.is_active = true AND (s.role::text IN ('super_admin','admissions_officer') OR COALESCE(s.permissions, '{}'::jsonb) ? 'enquiries.update_status' OR COALESCE(s.permissions, '{}'::jsonb) ? 'enquiries.assign')));
