-- APTECH Abeokuta — Phase 3 Admissions & Sales Analytics
-- Extends the existing CRM. No parallel lead/application/enrollment system is introduced.

-- Enrollment needs its own event timestamp for correct date attribution. The
-- existing application row remains the source of truth for the relationship.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS enrolled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_applications_enrolled_at
  ON public.applications (enrolled_at)
  WHERE enrolled_at IS NOT NULL;

-- Lost-lead reasons stay on the existing lead profile. No separate loss table.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lost_reason text;

CREATE INDEX IF NOT EXISTS idx_leads_lost_reason
  ON public.leads (lost_reason)
  WHERE lost_reason IS NOT NULL;

-- Backfill a reliable best-known timestamp for applications already marked
-- enrolled. Historical status-transition time did not previously exist, so
-- updated_at is the only source available for those existing records.
UPDATE public.applications
SET enrolled_at = updated_at
WHERE status = 'enrolled' AND enrolled_at IS NULL;

-- Lightweight anonymous interaction telemetry for Phase 1 experiences.
-- This is event telemetry, not a second lead/CRM system. Lead/application/
-- enrollment counts continue to come from the existing CRM relationships.
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null CHECK (event_name IN (
    'career_quiz_started',
    'career_quiz_recommendation_viewed',
    'career_quiz_completed',
    'tech_challenge_started',
    'tech_challenge_completed'
  )),
  lead_id uuid references public.leads(id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_name_created
  ON public.conversion_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_lead_id
  ON public.conversion_events (lead_id);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Public users can submit only the narrowly-defined event telemetry through
-- the application endpoint; management reads remain staff-only via the admin
-- client and existing dashboard permission gate.
CREATE POLICY "conversion_events_public_insert" ON public.conversion_events
  FOR INSERT TO anon, authenticated WITH CHECK (
    event_name IN (
      'career_quiz_started',
      'career_quiz_recommendation_viewed',
      'career_quiz_completed',
      'tech_challenge_started',
      'tech_challenge_completed'
    )
  );

CREATE POLICY "conversion_events_staff_select" ON public.conversion_events
  FOR SELECT TO authenticated USING (
    current_staff_role() IN ('super_admin', 'admissions_officer')
    OR staff_has_permission('dashboard_view_admissions_stats')
  );

-- Keep enrolled_at synchronized with the existing application lifecycle.
CREATE OR REPLACE FUNCTION public.sync_application_enrolled_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'enrolled' AND (OLD.status IS DISTINCT FROM 'enrolled' OR NEW.enrolled_at IS NULL) THEN
    NEW.enrolled_at := COALESCE(NEW.enrolled_at, now());
  ELSIF NEW.status IS DISTINCT FROM 'enrolled' AND OLD.status = 'enrolled' THEN
    NEW.enrolled_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_application_enrolled_at ON public.applications;
CREATE TRIGGER trg_sync_application_enrolled_at
BEFORE UPDATE OF status, enrolled_at ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.sync_application_enrolled_at();
