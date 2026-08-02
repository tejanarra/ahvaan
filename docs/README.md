# Ahvaan — Product Documentation & Build Reference

This folder is the **canonical planning reference** for building Ahvaan to a
customer-ready, production-grade product. It was produced from a full review of
the codebase as of 2026-07-30 (branch `saas`, post-Stage-5 — see `SAAS_PLAN.md`
at the repo root for the build history that led here).

**These docs are plans, not records.** `SAAS_PLAN.md` records what was built and
why; this folder specifies what to build next and how. When they conflict about
the future, this folder wins. When they conflict about the past, `SAAS_PLAN.md`
wins.

## Reading order

| Doc | What it covers | Read when |
|---|---|---|
| [01-product-definition.md](01-product-definition.md) | Vision, personas, user stories, use cases, the final feature matrix (keep / consolidate / defer) | Before any product or scope decision |
| [02-architecture-review.md](02-architecture-review.md) | Honest audit of the current architecture — strengths to preserve, weaknesses to fix — and the target architecture | Before any structural change |
| [03-codebase-restructure.md](03-codebase-restructure.md) | Concrete refactor plan: directory layout, data-access layer, validation, query efficiency, naming | During Phase 0 |
| [04-design-system.md](04-design-system.md) | The design theory and full design language: Studio (dashboard) + Stage (guest pages), tokens, typography, components, motion | Before touching any UI |
| [05-pages-and-navigation.md](05-pages-and-navigation.md) | Information architecture, navigation model, and a blueprint for every page (layout, components, states, responsive rules) | When building/reworking any page |
| [06-home-page.md](06-home-page.md) | The marketing home page: section-by-section blueprint for engagement | During Phase 3 |
| [07-build-phases.md](07-build-phases.md) | The phase-by-phase execution plan with review gates and definitions of done | Always — this is the schedule |
| [08-production-readiness.md](08-production-readiness.md) | Security hardening, error surfaces, SEO, accessibility, performance budgets, launch checklist | During Phases 5–6 and before launch |

## Execution protocol (for Claude Code sessions)

1. **Start every work session** by reading `07-build-phases.md` to find the
   current phase, then the docs that phase points at. Do not skip ahead of an
   unfinished review gate.
2. **Scope discipline**: the feature matrix in `01-product-definition.md` is
   final for v1. Anything marked *Deferred* is not built, even if easy. Anything
   marked *Consolidate* must reduce surface area, never add to it.
3. **Design discipline**: no new colors, sizes, fonts, or components outside
   `04-design-system.md`'s token set. If a screen needs something the system
   lacks, extend the system doc first, then implement.
4. **Every phase ends with its review gate** (listed per phase in
   `07-build-phases.md`): `npm run build` passes, the phase's verification
   steps done live in a browser, and `SAAS_PLAN.md` updated with a dated
   "what's built" entry.
5. **Non-negotiable invariants** (from `02-architecture-review.md`):
   - Every host-scoped query filters `.eq("host_id", host.id)` via the
     data-access layer — never inline ad-hoc queries once Phase 0 lands.
   - All external JSONB (`page_schema`, `form_schema`, `responses`) is parsed
     through validators before use — never `as`-cast.
   - Host-authored code only ever runs inside the sandboxed iframe model
     (`allow-scripts`, never `allow-same-origin`); host-authored styles are
     inline-style-parsed only, never injected as `<style>`.
6. **Keep docs current**: if implementation reveals a plan detail that's wrong,
   fix the doc in the same commit as the code.
