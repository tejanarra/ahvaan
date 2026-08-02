# Ahvaan

Multi-tenant event-invitation SaaS — hosts build a customizable event page
(drag-and-drop block editor, an editable RSVP form, per-block styling, a
sandboxed custom-code escape hatch), share personal invite links, and
track every RSVP. Next.js 16 (App Router, Server Components + Server
Actions), React 19, Tailwind CSS 4, Supabase (Auth + Postgres via a
service-role client), Resend.

**Before building anything, read `docs/README.md`** — the `docs/` folder
is the canonical plan for architecture, design system, page blueprints,
and the phase-by-phase build schedule. `SAAS_PLAN.md` is the historical
build log.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** (a fresh one, not a project already used
   by something else) and run the schema against it: open the SQL editor
   for your project and run the full contents of
   [`supabase/schema-saas.sql`](supabase/schema-saas.sql). The file is
   idempotent — safe to re-run after pulling schema changes.

3. **Configure environment variables** — copy `.env.example` to `.env.local`
   and fill in every value:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (server-only secret — never exposed to the client, see `src/lib/supabase/server.ts`) |
   | `RESEND_API_KEY` | [resend.com](https://resend.com) — needed for invite/reminder emails; not required for auth, the dashboard, or RSVPs to work |
   | `RESEND_FROM_EMAIL` | A Resend-verified sending address |
   | `NEXT_PUBLIC_SITE_URL` | The site's public origin, e.g. `http://localhost:3000` for local dev — used server-side to build links inside emails |
   | `GUEST_SESSION_SECRET` | Any long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up for a
   host account, create an event, and open its public link in an
   incognito window to see the guest-facing page.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build — also the correctness gate; run this before considering any change done |
| `npm run start` | Run a built app |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |

There is currently no automated test suite (`npm test` doesn't exist) —
correctness is verified via `npm run build` plus a live click-through of
the affected flow.

## Project structure

See `docs/02-architecture-review.md` and `docs/03-codebase-restructure.md`
for the full architecture writeup. The short version:

- `src/app/` — routes. Every mutation is a Server Action starting with
  `requireHost()`; there are no client-side Supabase calls.
- `src/lib/data/` — the only module that touches Supabase. Every
  host-scoped function takes `hostId` and filters on it internally.
- `src/lib/schemas/` — zod validators for every JSONB column
  (`page_schema`, `form_schema`, guest `responses`) — never trust a
  JSONB read with an `as` cast.
- `src/lib/blocks/` — the page-builder's block registry and public
  renderer (pure — no editor UI).
- `src/components/builder/` — editor-only UI, dashboard-side only.
- Host-authored code (the custom-HTML/custom-page blocks) only ever runs
  inside a `sandbox="allow-scripts"` iframe with no `allow-same-origin` —
  never weaken this. See `src/lib/blocks/sandbox.ts`.

## Deploying

The app is a standard Next.js deployment (e.g. Vercel) — set the same
environment variables as `.env.local` in your hosting provider, and make
sure `supabase/schema-saas.sql` has been run against your production
Supabase project. See `docs/08-production-readiness.md` for the full
pre-launch checklist (security headers, RLS, SEO, accessibility,
performance budgets).
