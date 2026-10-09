-- Full-funnel marketing analytics: reliable campaign spend and stage timestamps.
-- Extends the existing campaign/lead CRM; does not create a parallel lead store.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS first_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_counselled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_first_contacted_at ON public.leads(first_contacted_at) WHERE first_contacted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_first_counselled_at ON public.leads(first_counselled_at) WHERE first_counselled_at IS NOT NULL;

-- Capture future stage timestamps without rewriting unknown historical dates.
CREATE OR REPLACE FUNCTION public.track_lead_funnel_stage_timestamps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('contacted','interested','follow_up_later','application_started','application_submitted','admission_offered','enrolled')
     AND NEW.first_contacted_at IS NULL THEN
    NEW.first_contacted_at := now();
  END IF;
  IF NEW.status = 'counselling' AND NEW.first_counselled_at IS NULL THEN
    NEW.first_counselled_at := now();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_track_lead_funnel_stage_timestamps ON public.leads;
CREATE TRIGGER trg_track_lead_funnel_stage_timestamps
BEFORE INSERT OR UPDATE OF status ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.track_lead_funnel_stage_timestamps();

-- Staff-entered/imported campaign spend. Amounts are explicit and auditable;
-- cost metrics are only calculated when a single currency is available.
CREATE TABLE IF NOT EXISTS public.campaign_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  spend_date date NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency ~ '^[A-Z]{3}$'),
  source_note text,
  created_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, spend_date, currency)
);
CREATE INDEX IF NOT EXISTS idx_campaign_spend_date_campaign ON public.campaign_spend(spend_date, campaign_id);
ALTER TABLE public.campaign_spend ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaign_spend_staff_select ON public.campaign_spend;
CREATE POLICY campaign_spend_staff_select ON public.campaign_spend FOR SELECT TO authenticated
USING (is_active_staff());
DROP POLICY IF EXISTS campaign_spend_staff_manage ON public.campaign_spend;
CREATE POLICY campaign_spend_staff_manage ON public.campaign_spend FOR ALL TO authenticated
USING (current_staff_role() IN ('super_admin','admissions_officer') OR staff_has_permission('dashboard_view_reports'))
WITH CHECK (current_staff_role() IN ('super_admin','admissions_officer') OR staff_has_permission('dashboard_view_reports'));
DROP TRIGGER IF EXISTS trg_campaign_spend_updated_at ON public.campaign_spend;
CREATE TRIGGER trg_campaign_spend_updated_at BEFORE UPDATE ON public.campaign_spend
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.campaign_spend IS 'Verified/manual campaign spend inputs for cost-per-inquiry and cost-per-enrolment reporting. Do not infer spend from clicks.';
