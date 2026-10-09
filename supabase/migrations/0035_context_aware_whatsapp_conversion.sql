-- Context-aware WhatsApp conversion telemetry and confirmed CRM outcomes.
-- Click events remain anonymous; only authenticated staff actions link outcomes to a lead.
ALTER TABLE public.conversion_events
  DROP CONSTRAINT IF EXISTS conversion_events_event_name_check;

ALTER TABLE public.conversion_events
  ADD CONSTRAINT conversion_events_event_name_check CHECK (event_name IN (
    'career_quiz_started','career_quiz_recommendation_viewed','career_quiz_completed',
    'tech_challenge_started','tech_challenge_completed','comparison_started',
    'comparison_programme_added','comparison_programme_removed','comparison_completed',
    'comparison_cta_clicked','career_pathway_viewed','student_story_viewed',
    'student_project_viewed','advisor_cta_clicked','enquiry_cta_clicked',
    'application_cta_clicked','campaign_landing_viewed','campaign_cta_clicked',
    'tech_zone_viewed','challenge_started','challenge_completed','challenge_result_viewed',
    'challenge_lead_captured','challenge_cta_clicked','challenge_whatsapp_clicked',
    'playground_viewed','playground_activity_started','playground_activity_completed',
    'playground_cta_clicked','playground_share_clicked','playground_badge_earned',
    'playground_leaderboard_name_set','playground_lead_captured','programme_page_viewed',
    'fee_inquiry','consultation_booked','application_completed',
    'whatsapp_conversion_clicked','whatsapp_contact_outcome_recorded',
    'whatsapp_progressed_to_counselling','whatsapp_progressed_to_application'
  ));

CREATE INDEX IF NOT EXISTS idx_conversion_events_whatsapp_created
  ON public.conversion_events (created_at DESC)
  WHERE event_name IN (
    'whatsapp_conversion_clicked','whatsapp_contact_outcome_recorded',
    'whatsapp_progressed_to_counselling','whatsapp_progressed_to_application'
  );

COMMENT ON CONSTRAINT conversion_events_event_name_check ON public.conversion_events IS
  'Allow-listed anonymous engagement and staff-confirmed conversion events; WhatsApp click metadata must not contain direct personal data.';
