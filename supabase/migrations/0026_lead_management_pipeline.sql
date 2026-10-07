-- APTECH Abeokuta — Lead Management & Follow-Up Conversion System
-- Extends the existing CRM; no parallel lead system is introduced.

DO $$ BEGIN
  CREATE TYPE lead_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS priority lead_priority NOT NULL DEFAULT 'low';

CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads (priority);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_pending ON public.follow_ups (due_date) WHERE status = 'pending';

-- Recalculate a simple staff-facing priority from existing CRM signals. This is
-- prioritisation only; it is not an enrolment prediction or score.
CREATE OR REPLACE FUNCTION public.refresh_lead_priority(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status lead_status;
  v_source lead_source;
  v_priority lead_priority := 'low';
  v_has_quiz boolean := false;
  v_has_advisor boolean := false;
  v_has_application boolean := false;
  v_has_programme boolean := false;
  v_repeat_engagement boolean := false;
BEGIN
  SELECT status, source INTO v_status, v_source FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT EXISTS (SELECT 1 FROM public.interactive_quiz_results WHERE lead_id = p_lead_id) INTO v_has_quiz;
  SELECT EXISTS (SELECT 1 FROM public.interactions WHERE lead_id = p_lead_id AND (subject ILIKE '%advisor%' OR description ILIKE '%advisor%' OR subject ILIKE '%admission%' OR description ILIKE '%admission%')) INTO v_has_advisor;
  SELECT EXISTS (SELECT 1 FROM public.applications WHERE lead_id = p_lead_id) INTO v_has_application;
  SELECT EXISTS (SELECT 1 FROM public.lead_interests WHERE lead_id = p_lead_id AND programme_id IS NOT NULL) INTO v_has_programme;
  SELECT (COUNT(*) >= 3) INTO v_repeat_engagement FROM public.interactions WHERE lead_id = p_lead_id;

  IF v_has_application OR v_has_programme OR v_status IN ('application_started','application_submitted','admission_offered','enrolled') OR v_has_advisor OR v_source = 'advisor_request' THEN
    v_priority := 'high';
  ELSIF v_status IN ('contacted','interested','counselling','follow_up_later') OR v_has_quiz OR v_repeat_engagement OR v_source IN ('career_quiz','tech_challenge') THEN
    v_priority := 'medium';
  END IF;

  UPDATE public.leads SET priority = v_priority WHERE id = p_lead_id AND priority IS DISTINCT FROM v_priority;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_lead_priority_from_interaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.refresh_lead_priority(NEW.lead_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.refresh_lead_priority_from_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.refresh_lead_priority(NEW.lead_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.refresh_lead_priority_from_interest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.refresh_lead_priority(NEW.lead_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.refresh_lead_priority_from_quiz()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.refresh_lead_priority(NEW.lead_id); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_refresh_lead_priority_interaction ON public.interactions;
CREATE TRIGGER trg_refresh_lead_priority_interaction
AFTER INSERT ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.refresh_lead_priority_from_interaction();

DROP TRIGGER IF EXISTS trg_refresh_lead_priority_application ON public.applications;
CREATE TRIGGER trg_refresh_lead_priority_application
AFTER INSERT OR UPDATE OF status ON public.applications FOR EACH ROW EXECUTE FUNCTION public.refresh_lead_priority_from_application();

DROP TRIGGER IF EXISTS trg_refresh_lead_priority_interest ON public.lead_interests;
CREATE TRIGGER trg_refresh_lead_priority_interest
AFTER INSERT OR UPDATE OF programme_id ON public.lead_interests FOR EACH ROW EXECUTE FUNCTION public.refresh_lead_priority_from_interest();

DROP TRIGGER IF EXISTS trg_refresh_lead_priority_quiz ON public.interactive_quiz_results;
CREATE TRIGGER trg_refresh_lead_priority_quiz
AFTER INSERT ON public.interactive_quiz_results FOR EACH ROW EXECUTE FUNCTION public.refresh_lead_priority_from_quiz();

-- Backfill existing records.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.leads LOOP
    PERFORM public.refresh_lead_priority(r.id);
  END LOOP;
END $$;
