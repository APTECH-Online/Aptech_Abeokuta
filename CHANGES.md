# APTECH events page redesign: changed files

Unzip over the project root (paths match the repo). No backend, API or database changes.

Modified:
- app/(site)/events/page.tsx
- components/events/EventRegistrationForm.tsx

New:
- components/events/EventCard.tsx
- components/events/EventPickButton.tsx
- components/events/EventsInfo.tsx
- components/events/EventsAside.tsx
- components/events/event-meta.ts
- components/events/events-page.css   (imported by the page; all classes prefixed ev-)

Then run: npm run build
