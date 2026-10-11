-- Event registrations now create CRM leads. The new enum value lives in its own
-- migration because Postgres cannot use a freshly added enum value in the same
-- transaction that adds it (0041 references it from a function body).
alter type lead_source add value if not exists 'campus_event';
