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

Environment variables

- `NEXT_PUBLIC_SITE_URL` — your production canonical site URL (e.g. https://www.example.com)
- `NEXT_PUBLIC_CONTACT_EMAIL` — public contact email placeholder

Vercel

1. Push the repository to GitHub.
2. Import the repo into Vercel and set `NEXT_PUBLIC_SITE_URL` in Project Settings → Environment Variables.
3. Deploy (Vercel will run `npm install` and `npm run build`).

