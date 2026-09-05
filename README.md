# APTECH Abeokuta — Next.js Website

Professional website for APTECH Abeokuta built with Next.js, TypeScript, and Tailwind CSS.

Technology stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Vercel-compatible

Requirements

- Node.js 18+ and npm

Install

```bash
npm install
```

Run (development)

```bash
npm run dev
```

Build (production)

```bash
npm run build
```

Environment

Create a `.env.local` for local overrides and copy `.env.example` for required variables.

Deployment

This project is prepared for deployment on Vercel via GitHub. Connect the repository to Vercel and set the environment variable `NEXT_PUBLIC_SITE_URL` to your production domain.

CRM & Admissions Management System

This project also includes a full CRM at `/admin`, backed by Supabase, for
managing admissions leads, applications, follow-ups and programmes. See
[`docs/CRM_SETUP.md`](./docs/CRM_SETUP.md) for setup, environment variables,
roles, and deployment notes.

Environment variables

- `NEXT_PUBLIC_SITE_URL` — your production canonical site URL (e.g. https://www.example.com)
- `NEXT_PUBLIC_CONTACT_EMAIL` — public contact email placeholder

Vercel

1. Push the repository to GitHub.
2. Import the repo into Vercel and set `NEXT_PUBLIC_SITE_URL` in Project Settings → Environment Variables.
3. Deploy (Vercel will run `npm install` and `npm run build`).

---

## 2026 redesign notes

This project went through a full visual and UX redesign while preserving the original
routes, data model, and Next.js/Tailwind stack.

### Bug fixed
The original `globals.css` used Tailwind v3 `@tailwind base/components/utilities`
directives with Tailwind v4 installed and **no PostCSS plugin configured**, so almost
none of the utility classes used across the components were ever applied — the site was
rendering essentially unstyled. This has been fixed:
- Added `postcss.config.mjs` with `@tailwindcss/postcss`.
- Rewrote `app/globals.css` using Tailwind v4's `@import "tailwindcss"` and `@theme` token
  syntax.

### Design system
- Palette: navy/indigo (primary/brand), teal (links/accents), amber (calls to action, badges) —
  defined as CSS custom properties in `app/globals.css` under the "Adire Circuit" token set.
- Typography: Sora (headings), Manrope (body), IBM Plex Mono (labels, tags, and the
  "console card" motif), loaded via `next/font/google` in `app/layout.tsx`.
- Signature element: a terminal/"console card" component (`.console-card` in
  `globals.css`) used sparingly in the hero, course detail sidebar, and error/404 pages to
  tie the visual identity to the technology-education subject matter without relying on
  gradients, glassmorphism, or heavy shadows.
- Shared building blocks live in `components/ui` and `components/shared`
  (`Container`, `SectionHeading`, `Accordion`, `CourseIcon`, `PageHero`, `Breadcrumbs`).

### Note on fonts and this build environment
`next/font/google` fetches font files from Google Fonts at **build time**. In network-
restricted environments (like the sandbox used to prepare this redesign) that fetch is
blocked and `npm run build` will fail with a "Failed to fetch ... from Google Fonts"
error. This is expected in that environment only — Vercel and any normal development
machine have unrestricted access to `fonts.googleapis.com` / `fonts.gstatic.com`, so
`npm install && npm run build` will succeed there without changes. (Every other part of
the app — components, pages, TypeScript — was verified independently of this by
temporarily swapping out the font imports during QA; `npx tsc --noEmit` and a full
`next build` with fonts stubbed out both pass cleanly.)

### Content status
All public-facing copy, statistics, testimonials, contact details, and partner logos
have been checked against APTECH Abeokuta's own published materials — nothing on the
public site is invented. A few items are still worth owner review before launch:
- `data/site.ts` — `social.facebook` is a verified link; add other verified handles
  (Instagram, LinkedIn, X) if the centre has them — don't guess a URL.
- `app/(site)/contact/page.tsx` and `app/(site)/admissions/page.tsx` — the enquiry/
  contact forms are front-end only (the admissions form gracefully falls back to a
  "contact us by email" message if Supabase isn't configured); wire the contact form
  to an email service or the existing CRM (`lib/crm`) before launch.
- `app/(site)/privacy/page.tsx` and `app/(site)/terms/page.tsx` — working drafts that
  describe the site's actual data practices and enrolment policies; have them reviewed
  by qualified legal counsel before treating them as final.
- `components/gallery/Gallery.tsx` — uses the four real campus/event photos supplied
  plus two brand illustrations; swap in additional real photography as it becomes
  available (each tile is a simple array entry).

### What's new structurally
- `app/loading.tsx` and `app/error.tsx` — global loading skeleton and error boundary.
- `app/not-found.tsx` — redesigned 404 using the console-card motif.
- Enriched `data/courses.ts` (highlights, tools, outcomes) powering richer course cards
  and detail pages, plus category filtering in `components/courses/CourseSearch.tsx`.
- Accessibility: skip-to-content link, visible focus states, semantic landmarks and
  heading order, `aria-current`/`aria-expanded`/`aria-pressed` on interactive nav,
  accordion, and filter chip components.



## Contact form → CRM database setup

The public Contact form now saves enquiries through the Supabase function `public.submit_contact_form`. Apply the migration below to the same Supabase project used by the deployed site:

```text
supabase/migrations/0002_contact_form_rpc.sql
```

In the Supabase SQL Editor, paste/run that migration (or run `supabase db push` if this project is linked to the correct Supabase project). The function is restricted to the `service_role`, so it is not directly callable by anonymous visitors.

After deploying the Next.js changes and applying the migration, a Contact form submission creates/updates the lead and records a `website` interaction. The CRM dashboard also displays the latest website enquiries.
