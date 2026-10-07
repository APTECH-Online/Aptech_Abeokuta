-- APTECH Abeokuta — Phase 5 programme discovery and conversion context
-- Extends the existing course/lead/analytics systems. No parallel CMS, CRM
-- or analytics system is introduced.

-- Preserve Phase 5 attribution inside the existing lead_source enum.
alter type lead_source add value if not exists 'programme_comparison';

-- Extend the existing anonymous conversion telemetry table. Analytics remain
-- in conversion_events; this is not a second event store.
alter table public.conversion_events
  drop constraint if exists conversion_events_event_name_check;

alter table public.conversion_events
  add constraint conversion_events_event_name_check check (event_name in (
    'career_quiz_started',
    'career_quiz_recommendation_viewed',
    'career_quiz_completed',
    'tech_challenge_started',
    'tech_challenge_completed',
    'comparison_started',
    'comparison_programme_added',
    'comparison_programme_removed',
    'comparison_completed',
    'comparison_cta_clicked',
    'career_pathway_viewed',
    'student_story_viewed',
    'student_project_viewed',
    'advisor_cta_clicked',
    'enquiry_cta_clicked',
    'application_cta_clicked'
  ));

-- Document the new event vocabulary without introducing another analytics table.
comment on column public.conversion_events.event_name is
'Phase 1/3/5 conversion telemetry. Phase 5: comparison_started, comparison_programme_added, comparison_programme_removed, comparison_completed, comparison_cta_clicked, career_pathway_viewed, student_story_viewed, student_project_viewed, advisor_cta_clicked, enquiry_cta_clicked, application_cta_clicked.';
