# 02 — Architecture Review & Target Architecture

Reviewed 2026-07-30: every file in `src/`, `supabase/schema-saas.sql`,
`package.json`, and the full build history in `SAAS_PLAN.md`.

## Stack (unchanged — do not migrate anything)

Next.js 16 (App Router, Server Components + Server Actions), React 19,
Tailwind CSS 4 (CSS-first `@theme` tokens), Supabase (Auth + Postgres via
service-role client), Resend, dnd-kit. This stack is correct for the product;
no framework changes are planned or wanted.

## What is architecturally *right* today (preserve these)

1. **Server-action-only mutation model.** No client-side Supabase, no API
   routes; every mutation is a server action that starts with `requireHost()`.
   Simple, auditable, one trust boundary.
2. **Denormalized `host_id` + code-level tenancy.** Every table carries
   `host_id`; every host query filters on it. Verified live with a second
   host. (RLS policies remain the documented hardening step — Phase 5.)
3. **The block registry.** `BLOCK_REGISTRY` proved itself: custom-html landed
   as one new entry with zero renderer/builder changes. All new blocks go
   through it.
4. **Role-tagged form schema with graceful degradation.** `role:
   "name"|"attending"|"plus_ones"` lets hosts relabel/delete built-ins while
   stats degrade instead of lying. `deriveLegacyScalars` keeps old rows
   readable forever.
5. **The sandbox model.** Host code runs only in `sandbox="allow-scripts"`
   iframes (opaque origin, no `allow-same-origin`); host styles are parsed to
   inline style objects, never `<style>` tags. This two-tier model (inline
   styles for convenience, iframe for real code) is the security architecture
   — never weaken either tier.
6. **Generic layout wrapper.** `BlockLayout` applied by the renderer means
   block components stay layout-ignorant. Hard-won (see the alignment bug
   saga in SAAS_PLAN.md) — don't reintroduce per-block layout knowledge.
7. **Idempotent schema file.** `schema-saas.sql` is re-runnable; keep every
   future migration additive and idempotent in the same file.

## Weaknesses to fix (ranked by risk)

### W1 — Unvalidated JSONB trust (correctness/security)
`resolvePageSchema` checks only "has a non-empty blocks array" then casts
`as PageSchema`; `EventRecord` casts come straight off `select("*")`;
`responses` jsonb is trusted on read. A malformed or hand-edited schema row
crashes the public guest page (worst possible failure surface). **Fix:**
schema validators (zod) at every JSONB boundary with per-block fallback
(unknown/invalid block → skipped + logged, page still renders). Phase 0.

### W2 — No data-access layer (integrity of the tenancy model)
Queries are inlined in every page/action. The `.eq("host_id", ...)` invariant
is enforced by convention across ~15 call sites; one forgotten filter is a
cross-tenant leak. **Fix:** `src/lib/data/` repository modules (see doc 03)
whose host-scoped functions *require* a `hostId` argument; pages/actions never
touch the Supabase client directly. Phase 0.

### W3 — `select("*")` everywhere (efficiency)
The dashboard event list fetches full `page_schema`/`form_schema` JSONB (can
be tens of KB per event) to render title+date cards. The public page fetches
`*` including fields it never uses. **Fix:** explicit column lists per query,
defined once in the data layer. Phase 0.

### W4 — Zero caching on the public page (efficiency/scale)
`/events/[slug]` is `force-dynamic` and does 1–3 sequential queries per guest view.
The event row changes only when a host saves. **Fix:** cache the event-by-slug
read with `unstable_cache`/cache tags keyed `event:{slug}`, revalidated by
save actions; keep the invite/rsvp lookups dynamic. Also run independent
lookups concurrently. Phase 0.

### W5 — No draft state (product correctness)
Events are public the instant they're created (guessable only by slug, but
still). Hosts design in public. **Fix:** `status: 'draft'|'published'` column;
public page 404s drafts unless a host-session preview param; dashboard gets a
publish toggle. Phase 4.

### W6 — Inconsistent action/file organization
`dashboard/actions.ts` vs `dashboard/events/[eventId]/actions.ts` split by
route, with a naming collision (`sendInviteEmail` exists as both lib function
and action). `src/lib/page-blocks/` mixes pure types, public renderer, and
builder-editor UI in one lib folder. **Fix:** restructure per doc 03. Phase 0.

### W7 — `email_sends` breaks the denormalization pattern
No `host_id`/`event_id`/`error` columns — audit queries need joins and the
status string overloads `sent`/`failed: <msg>`. **Fix:** additive columns
(`host_id`, `event_id`, `error text`, status becomes clean enum-ish text).
Phase 0 migration.

### W8 — No error/loading/not-found surfaces
No `error.tsx`, `loading.tsx`, custom `not-found.tsx`, or global error page.
A thrown DB error yields the Next default screen — not customer-ready.
**Fix:** route-group-level error/loading/404 files styled by the design
system. Phase 5.

### W9 — No abuse controls on the public write path
`submitRsvp` accepts unbounded payloads; nothing limits body size or
submission rate beyond the invite-id secret. **Fix:** max lengths in shared
validation, payload size cap, light per-invite rate limit. Phase 5.

### W10 — Design debt
One accent color (indigo) for the whole Studio; guest themes are colors-only
on a shared font; landing page is a stub. Not an architecture flaw but the
main gap between "works" and "product". **Fix:** docs 04–06, Phases 1–3.

## Target architecture (end-state, after Phase 0–5)

```
Browser (host)                Browser (guest)
   │ RSC + server actions        │ RSC (cached event) + submitRsvp action
   ▼                             ▼
Next.js App Router ──────────────────────────────
  src/app/(marketing)/            public: /, login, signup, reset
  src/app/(host)/dashboard/       host: all host UI (requireHost in layout)
  src/app/events/[slug]/               guest: themed page renderer
        │  thin pages/actions: parse input → call data layer → revalidate
        ▼
  src/lib/data/                   ONLY module that touches Supabase
    events.ts / invites.ts / rsvps.ts / email-log.ts
    every host-scoped fn takes hostId; explicit column lists; cache tags
        │
        ▼
  src/lib/schemas/                zod validators: page-schema, form-schema,
                                  responses, event-input (single source of
                                  truth for both TS types and validation)
        │
        ▼
  Supabase Postgres (service-role only; RLS deny-all backstop → real
  policies in Phase 5) · Supabase Storage (event-images bucket, Phase 4)
  Resend (email) — called only from src/lib/email.ts
```

**Dependency rule:** `app/*` → `lib/data` + `lib/schemas` + `components/*`;
`lib/data` → `lib/schemas` + supabase client; nothing imports from `app/`.
Block system splits into `lib/blocks` (pure: types, registry metadata,
render components — usable by the public page) and
`components/builder/` (editor-only UI — only the dashboard imports it).

## Decision log (settled — do not re-litigate)
- Service-role + code-level tenancy stays primary; RLS policies are added as
  defense-in-depth in Phase 5, never as the primary model.
- No API routes; server actions remain the only mutation path.
- JSONB schemas stay on the `events` row (no separate pages/fields tables) —
  the editor saves whole documents atomically; relational decomposition buys
  nothing at this scale.
- Legacy scalar columns on `rsvps` are derived forever, per SAAS_PLAN.md.
- No client-state library; React state + server round-trips are sufficient.
