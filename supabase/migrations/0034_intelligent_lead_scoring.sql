-- Intelligent, explainable lead scoring. Extends the existing leads + conversion_events CRM.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_score_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lead_next_action text NOT NULL DEFAULT 'Review inquiry and make first contact',
  ADD COLUMN IF NOT EXISTS lead_score_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.lead_scoring_rules (
  event_name text PRIMARY KEY,
  label text NOT NULL,
  points integer NOT NULL CHECK (points BETWEEN 0 AND 100),
  enabled boolean NOT NULL DEFAULT true,
  max_occurrences integer NOT NULL DEFAULT 1 CHECK (max_occurrences BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lead_scoring_rules (event_name,label,points,enabled,max_occurrences) VALUES
 ('programme_page_viewed','Programme page viewed',5,true,5),
 ('programme_interest','Programme selected in enquiry',10,true,1),
 ('career_quiz_completed','Career quiz completed',10,true,1),
 ('fee_inquiry','Fees / tuition inquiry',20,true,1),
 ('consultation_booked','Consultation booked',25,true,1),
 ('application_completed','Application submitted/completed',50,true,1)
ON CONFLICT (event_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.lead_scoring_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  high_threshold integer NOT NULL DEFAULT 50 CHECK (high_threshold BETWEEN 1 AND 1000),
  medium_threshold integer NOT NULL DEFAULT 20 CHECK (medium_threshold BETWEEN 0 AND 999),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (medium_threshold < high_threshold)
);
INSERT INTO public.lead_scoring_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lead_scoring_rules_staff_read ON public.lead_scoring_rules;
CREATE POLICY lead_scoring_rules_staff_read ON public.lead_scoring_rules FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = auth.uid() AND s.is_active AND (s.role::text IN ('super_admin','admissions_officer') OR COALESCE(s.permissions,'{}'::jsonb) ? 'enquiries.view')));
DROP POLICY IF EXISTS lead_scoring_settings_staff_read ON public.lead_scoring_settings;
CREATE POLICY lead_scoring_settings_staff_read ON public.lead_scoring_settings FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = auth.uid() AND s.is_active AND (s.role::text IN ('super_admin','admissions_officer') OR COALESCE(s.permissions,'{}'::jsonb) ? 'enquiries.view')));

ALTER TABLE public.conversion_events DROP CONSTRAINT IF EXISTS conversion_events_event_name_check;
ALTER TABLE public.conversion_events ADD CONSTRAINT conversion_events_event_name_check CHECK (event_name IN (
 'career_quiz_started','career_quiz_recommendation_viewed','career_quiz_completed','tech_challenge_started','tech_challenge_completed',
 'comparison_started','comparison_programme_added','comparison_programme_removed','comparison_completed','comparison_cta_clicked',
 'career_pathway_viewed','student_story_viewed','student_project_viewed','advisor_cta_clicked','enquiry_cta_clicked','application_cta_clicked',
 'campaign_landing_viewed','campaign_cta_clicked','tech_zone_viewed','challenge_started','challenge_completed','challenge_result_viewed',
 'challenge_lead_captured','challenge_cta_clicked','challenge_whatsapp_clicked','playground_viewed','playground_activity_started',
 'playground_activity_completed','playground_cta_clicked','playground_share_clicked','playground_badge_earned','playground_leaderboard_name_set',
 'playground_lead_captured','programme_page_viewed','fee_inquiry','consultation_booked','application_completed'
));

CREATE OR REPLACE FUNCTION public.recalculate_intelligent_lead_score(p_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record; v_count integer; v_points integer := 0; v_total integer := 0;
  v_reasons jsonb := '[]'::jsonb; v_priority lead_priority := 'low';
  v_high integer := 50; v_medium integer := 20; v_action text := 'Review inquiry and make first contact';
  v_has_application boolean := false; v_has_booking boolean := false; v_has_fee_interaction boolean := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN RETURN; END IF;
  SELECT high_threshold, medium_threshold INTO v_high, v_medium FROM public.lead_scoring_settings WHERE id = 1;
  v_high := COALESCE(v_high,50); v_medium := COALESCE(v_medium,20);
  SELECT EXISTS (SELECT 1 FROM public.applications WHERE lead_id=p_lead_id AND status IN ('submitted','under_review','accepted','enrolled')) INTO v_has_application;
  SELECT EXISTS (SELECT 1 FROM public.consultation_bookings WHERE lead_id=p_lead_id AND status IN ('confirmed','completed')) INTO v_has_booking;
  SELECT EXISTS (SELECT 1 FROM public.interactions WHERE lead_id=p_lead_id AND (COALESCE(subject,'') || ' ' || COALESCE(description,'')) ILIKE '%fee%') INTO v_has_fee_interaction;
  FOR r IN SELECT * FROM public.lead_scoring_rules WHERE enabled ORDER BY event_name LOOP
    SELECT LEAST(r.max_occurrences, COUNT(*))::integer INTO v_count
      FROM public.conversion_events e WHERE e.lead_id=p_lead_id AND e.event_name=r.event_name;
    -- Treat CRM records as first-class signals even if older booking/application flows
    -- predate conversion telemetry. Never double-count the synthetic signal.
    IF r.event_name='programme_interest' AND EXISTS (SELECT 1 FROM public.lead_interests WHERE lead_id=p_lead_id AND programme_id IS NOT NULL) AND COALESCE(v_count,0)=0 THEN v_count:=1; END IF;
    IF r.event_name='career_quiz_completed' AND EXISTS (SELECT 1 FROM public.interactive_quiz_results WHERE lead_id=p_lead_id) AND COALESCE(v_count,0)=0 THEN v_count:=1; END IF;
    IF r.event_name='consultation_booked' AND v_has_booking AND COALESCE(v_count,0)=0 THEN v_count:=1; END IF;
    IF r.event_name='application_completed' AND v_has_application AND COALESCE(v_count,0)=0 THEN v_count:=1; END IF;
    IF r.event_name='fee_inquiry' AND v_has_fee_interaction AND COALESCE(v_count,0)=0 THEN v_count:=1; END IF;
    v_points := COALESCE(v_count,0) * r.points;
    IF v_points > 0 THEN
      v_total := v_total + v_points;
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('event',r.event_name,'label',r.label,'count',v_count,'points',v_points));
    END IF;
  END LOOP;
  v_total := LEAST(v_total,100);
  IF v_total >= v_high THEN v_priority := 'high';
  ELSIF v_total >= v_medium THEN v_priority := 'medium'; END IF;
  IF v_has_application THEN v_action := 'Contact applicant today and help resolve any outstanding application steps';
  ELSIF v_has_booking THEN v_action := 'Confirm the counselling appointment and prepare programme / fee answers';
  ELSIF v_has_fee_interaction OR EXISTS (SELECT 1 FROM public.conversion_events WHERE lead_id=p_lead_id AND event_name='fee_inquiry') THEN v_action := 'Follow up on fees, payment options and the next available intake';
  ELSIF EXISTS (SELECT 1 FROM public.lead_interests WHERE lead_id=p_lead_id AND programme_id IS NOT NULL) THEN v_action := 'Confirm the selected programme, preferred intake and learning schedule';
  ELSIF EXISTS (SELECT 1 FROM public.conversion_events WHERE lead_id=p_lead_id AND event_name='programme_page_viewed') THEN v_action := 'Ask which programme they are considering and offer a short counselling call';
  END IF;
  UPDATE public.leads SET lead_score=v_total, lead_score_reasons=v_reasons, lead_next_action=v_action,
    priority=v_priority, lead_score_updated_at=now()
  WHERE id=p_lead_id;
END; $$;

-- Keep the legacy CRM priority triggers aligned with the new explainable model.
-- Migration 0026 still calls this function for interactions, interests, applications
-- and quiz results, so delegate rather than allowing two priority systems to conflict.
CREATE OR REPLACE FUNCTION public.refresh_lead_priority(p_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.recalculate_intelligent_lead_score(p_lead_id);
END; $$;

CREATE OR REPLACE FUNCTION public.recalculate_lead_score_from_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.lead_id IS NOT NULL THEN PERFORM public.recalculate_intelligent_lead_score(NEW.lead_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.recalculate_lead_score_from_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.lead_id IS NOT NULL THEN PERFORM public.recalculate_intelligent_lead_score(NEW.lead_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.recalculate_lead_score_from_application() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM public.recalculate_intelligent_lead_score(NEW.lead_id); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_intelligent_score_conversion_event ON public.conversion_events;
CREATE TRIGGER trg_intelligent_score_conversion_event AFTER INSERT OR UPDATE OF lead_id ON public.conversion_events FOR EACH ROW EXECUTE FUNCTION public.recalculate_lead_score_from_event();
DROP TRIGGER IF EXISTS trg_intelligent_score_booking ON public.consultation_bookings;
CREATE TRIGGER trg_intelligent_score_booking AFTER INSERT OR UPDATE OF status, lead_id ON public.consultation_bookings FOR EACH ROW EXECUTE FUNCTION public.recalculate_lead_score_from_booking();
DROP TRIGGER IF EXISTS trg_intelligent_score_application ON public.applications;
CREATE TRIGGER trg_intelligent_score_application AFTER INSERT OR UPDATE OF status ON public.applications FOR EACH ROW EXECUTE FUNCTION public.recalculate_lead_score_from_application();
DROP TRIGGER IF EXISTS trg_intelligent_score_interest ON public.lead_interests;
CREATE TRIGGER trg_intelligent_score_interest AFTER INSERT OR UPDATE OF programme_id ON public.lead_interests FOR EACH ROW EXECUTE FUNCTION public.recalculate_lead_score_from_application();
DROP TRIGGER IF EXISTS trg_intelligent_score_interaction ON public.interactions;
CREATE TRIGGER trg_intelligent_score_interaction AFTER INSERT OR UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.recalculate_lead_score_from_application();
CREATE OR REPLACE FUNCTION public.recalculate_all_intelligent_lead_scores() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; BEGIN FOR r IN SELECT id FROM public.leads LOOP PERFORM public.recalculate_intelligent_lead_score(r.id); END LOOP; END; $$;
SELECT public.recalculate_all_intelligent_lead_scores();
