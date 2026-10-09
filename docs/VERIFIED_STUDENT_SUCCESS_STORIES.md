# Verified Student Success Stories

## Migration
Apply `supabase/migrations/0038_verified_student_success_stories.sql` after migration 0037. This migration intentionally unpublishes existing testimonial rows until staff confirm authenticity and permission.

## CMS workflow
In Admin → Testimonials, select a story type, associate the programme, add optional project/achievement context, and check the required authenticity/permission confirmation. A story is publicly visible only when both `is_published = true` and `consent_confirmed = true`. Employer and certification claims must be evidence-checked by staff before publication.

## Public presentation
Story cards show the story type and optional project context and include a contextual inquiry CTA that passes the programme and story ID to `/contact`. The public query only returns approved-consent stories.

## Important
No story, salary, employer, certification, or employment outcome should be invented. Review seeded/legacy copy with the actual student before re-publishing. Keep supporting consent/evidence records in the organisation’s approved secure system; do not upload sensitive documents to public storage.
