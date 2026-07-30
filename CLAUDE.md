# Gatherie (branch `saas`)

Multi-tenant event-invitation SaaS (Next.js 16 + Supabase + Resend).

**Before building anything, read `docs/README.md`** — the `docs/` folder is
the canonical plan for architecture, design system, page blueprints, and the
phase-by-phase build schedule (`docs/07-build-phases.md` says what to work on
next). `SAAS_PLAN.md` is the historical build log; keep appending dated
entries to it after each phase gate.

Non-negotiable invariants (details in `docs/02-architecture-review.md`):
- Every host-scoped query filters `host_id`; after Phase 0, only via `src/lib/data/`.
- Validate all JSONB (`page_schema`/`form_schema`/`responses`) — never `as`-cast.
- Host code runs only in sandboxed iframes (`allow-scripts`, never
  `allow-same-origin`); host styles are inline-parsed, never `<style>` tags.
- Scope: `docs/01-product-definition.md`'s feature matrix is final — deferred
  features stay deferred.
- Design: use only `docs/04-design-system.md` tokens/faces (Fraunces +
  Hanken Grotesk, paper/ink palette); extend the doc before adding visuals.

Verify with `npm run build` plus the phase's review gate before calling work done.
