# 10 — Docs Site: Scope, IA & Build Plan

Status: **proposal, not yet built** — added 2026-08-02, user-directed, outside
`01-product-definition.md`'s original v1 feature matrix (same category as the
generic multi-form system and public host profile: a real, scoped addition,
not scope creep, per that doc's note on additions made the same way).

## Why

A public, browsable documentation site — `/docs` — modeled on the docs sites
of React, Next.js, Astro, and Formio: a persistent left sidebar of topics, a
content column, and (where it helps) a page-local "on this page" outline.
Two audiences, kept in separate top-level sections so neither dilutes the
other:

1. **Guides** — for hosts using the product: what every page-builder block
   does, how theming/custom code/forms/guest-tracking/email work, how to
   install the PWA on each platform. Plain language, task-oriented, no
   internals.
2. **Reference** — for developers/contributors working on the codebase:
   architecture, the `host_id`-scoping and JSONB-validation invariants, the
   block/field registry extension pattern, the sandboxing model, testing/CI.
   Assumes the reader has the repo open.

This is genuinely a third product surface (Studio, Stage, and now **Docs**),
not a page bolted onto either. It gets its own short design note below rather
than silently inheriting Studio or Stage wholesale, per doc 04's rule that
nothing ships outside its token set — if Docs needs something neither
existing surface defines, that gets decided here, once, before any page is
written.

## Where it lives

- Route: `src/app/docs/` (public, no auth — same route group tier as `/`,
  `/privacy`, `/terms`).
- `layout.tsx` renders the persistent left sidebar (topic tree) + content
  slot; `page.tsx` is the Docs landing page (a short index, not a full guide).
  Each guide/reference topic is its own `page.tsx` under a slug directory
  (`docs/pwa-install/page.tsx`, `docs/blocks/hero/page.tsx`, etc.) — plain
  static content, not MDX (see Content authoring below), so every page is a
  normal React component and gets full type-checking on its content, matching
  the rest of this codebase's "no new tooling unless the system needs it"
  discipline.
- Linked from: the marketing home page footer, and a "Docs" link in the
  dashboard's account/help affordance (exact placement decided at build time
  against doc 05's nav rules — not a new nav tier, just a link).

## Design note (extending doc 04)

Docs is closest to **Stage** in spirit (public, content-first, allowed real
typographic presence) but needs one thing neither surface has: a persistent
**docs side nav** that's a real navigation tree (multi-level, expand/collapse
by section), unlike Studio's flat, never-nested `SideNav` (doc 04 is explicit
that `SideNav` never nests a second level — that rule stands *for Studio*;
Docs is a different surface with a different job, so it earns its own
component rather than bending that one).

New component, `components/docs/DocsNav` — built from existing primitives,
no new tokens:
- Warm paper background (`--background`), same as Studio — Docs is reference
  material, not a themed guest page, so it should read calm and legible, not
  "expressive" like a live invitation.
- Section headers: `text-caption` (the existing letterspaced small-caps
  token) — reuses signature move #3 from doc 04 rather than inventing a new
  label style.
- Topic links: `text-body`, current-page state = `bg-accent-soft` +
  `text-accent` + left accent rail — the same "current" treatment `SideNav`
  already uses, just allowed to nest.
- Content column: `text-body`/`text-heading`/`text-title` per doc 04's scale,
  line length capped at 65ch (already a doc-04 rule for prose), headings use
  Fraunces per doc 04.
- Code samples (Reference section only): monospace via the existing
  `--font-mono` token already defined in `globals.css` (confirmed present,
  currently unused outside dev tooling) on `--surface-sunken`, `--radius-sm`
  — no new color needed, this reuses the existing "well" treatment doc 04
  already defines for canvas/code areas.
- No new colors, no dark mode (matches doc 04's Studio stance — Docs is
  read next to Studio, not next to a themed guest page).

## Content authoring

Plain `.tsx` page files under `src/app/docs/**`, written directly using the
same design-system primitives as everything else (`Card`, `Badge`, the new
`DocsNav`) — not MDX, not a CMS, not a new build dependency. Each Guides page
follows one shape: what it does → how to configure it → one non-obvious
behavior callout (styled as a `Card` with a small accent-left-border, reusing
existing primitives, not a new "callout" component unless three+ pages need
one and the shape repeats identically). Each Reference page follows: what it
is → where it lives (file paths) → the one invariant/pattern a contributor
must not break, with real file:line citations kept up to date the same way
this docs/ folder already is (doc README's rule 6: fix the doc in the same
commit as the code, whenever the two drift).

## Site map

### Guides (host-facing)

- **Getting started** — the two-minute event flow (signup → create event →
  copy invite link → guest RSVPs), matching `01-product-definition.md`'s
  "Two-minute event" use case almost verbatim as a walkthrough.
- **Installing ahvaan as an app (PWA)** — one page, three platform sections:
  - iOS Safari: Share sheet → "Add to Home Screen" (manual, no banner).
  - Android Chrome: native "Install app" banner/menu item.
  - Desktop Chrome/Edge: omnibox install icon / browser menu.
  Note that installing while signed out lands on `/` (not `/dashboard`) by
  design, and a signed-in host is bounced from the auth pages straight to
  `/dashboard`, so an installed icon still reaches the dashboard in one tap.
- **Events** — draft vs. published, editing details, RSVP deadlines, deleting
  an event (and what deleting cleans up).
- **The page builder** — one overview page, then one page per block type
  (Hero, Text, Image, Carousel, Spacer, Countdown, Schedule, RSVP form,
  Custom form, Venue map, Custom HTML, Container) plus:
  - Layout controls (width/align/spacing, mobile/tablet overrides)
  - Starter layouts
  - Styling surfaces (block CSS, container style, page style, theme
    overrides, font family) presented as one consolidated "Styling" page
    per doc 01's planned UI consolidation, not five separate pages
  - Custom code & sandboxing (what's safe, what a host can and can't do,
    the `{{rsvp_form}}`/`{{venue_map}}` shortcodes, reusable components)
- **Themes** — the 8 presets, what each controls, per-page overrides.
- **RSVP form** — field types, role-tagged fields, what happens if a host
  removes a role field (graceful stat degradation, not broken guest data).
- **Custom forms** — building a form, field vocabulary, embedding via the
  page builder, viewing submissions, post-submit behavior.
- **Guests & tracking** — invite links, dashboard tabs/search/sort/stats,
  CSV export, editing a guest's RSVP.
- **Email invites & reminders** — sending, the send-status log, what a
  failed send looks like.
- **Your public profile** — what shows on guest pages, the always-on
  disclaimer line and why it's unconditional.
- **Images** — upload limits (file types, 5MB cap, auto-compression).
- **Account & security** — signup/login/password reset, the
  anti-enumeration behavior on password reset, rate limits a host/guest
  might hit on public forms (framed as "why did my request get delayed,"
  not as a security internals page — that's Reference's job).

### Reference (developer-facing)

- **Architecture overview** — the `src/app/` / `src/components/` / `src/lib/`
  split, the dependency rule (`app` → `lib/data` + `lib/schemas` →
  Supabase), the `lib/blocks` (pure) vs `components/builder` (editor-only)
  split.
- **The `host_id` invariant** — what it is, 2–3 concrete file:line examples,
  the deliberate exception (guest-facing reads scoped by invite/slug instead)
  and why that's not a violation.
- **JSONB validation** — the Zod lenient-read/strict-write pattern per
  column, why `page_schema` validates loosely per-block while
  `custom-form-schema` validates strictly per-field-kind, and the one
  legacy exception (`form-schema.ts`'s hand-rolled RSVP engine, and why it's
  intentionally a second, older engine rather than unified with the generic
  Forms system).
- **Adding a new block type** — the exact 4-step registry pattern
  (`types.ts` union entry → `blocks/<name>.tsx` → `BLOCK_REGISTRY` entry →
  `BLOCK_TYPES` in `page-schema.ts`), and the parallel field-registry
  pattern for the generic Forms system.
- **The sandboxing model** — `buildSandboxSrcDoc`, the `allow-scripts`
  (never `allow-same-origin`) boundary, why CSS elsewhere is inline-style-
  parsed and never becomes a `<style>` tag, and the CSP-nonce inheritance
  detail (`srcDoc` iframes inherit the parent's CSP verbatim).
- **Rate limiting & size budgets** — the two-tier (in-memory + DB sliding
  window) limiter, fail-open behavior, and the payload/field-length caps on
  public submissions.
- **Design tokens** — links out to `04-design-system.md` as the source of
  truth; this page is just "where the tokens live in code"
  (`src/app/globals.css`'s `@theme inline` block) for a contributor who
  wants to change a value, not a restatement of doc 04.
- **Testing & CI** — Vitest, what's covered today (rate-limit, sandbox,
  safe-url, keyed-cache, page-schema), the GitHub Actions pipeline
  (lint → test → build).
- **Caching** — the custom `keyed-cache` module and why it exists instead of
  `unstable_cache` (untemplatable tags).

## Build phases (if approved)

1. **Scaffold**: `src/app/docs/layout.tsx` + `DocsNav` component + landing
   page, empty topic pages with just titles (verifies IA/routing/nav before
   content work).
2. **Guides content**: one page per Guides topic above, written from the
   Phase-inventory facts already gathered (this doc's companion research
   pass) — cross-checked live against the running app, not written from
   memory.
3. **Reference content**: one page per Reference topic above, each carrying
   real file:line citations, verified against `src/` at write time.
4. **Review gate**: `npm run build` passes; every code citation spot-checked
   against current `src/`; a11y pass (keyboard nav through `DocsNav`, focus-
   visible, landmark regions) per doc 04's accessibility bar; link check
   (Guides ↔ Reference cross-links, e.g. a Guides "Custom code" page linking
   to Reference's "sandboxing model" for the curious).
5. Update `SAAS_PLAN.md` with a dated entry, same as every other phase.

## Explicitly out of scope for v1 of this docs site

- Search (no Algolia/local-search integration) — a flat, well-organized side
  nav is enough at this content volume; revisit only if the page count grows
  large enough that a nav tree stops being sufficient.
- Versioning (this product has no public API/versioned releases to document
  against).
- i18n — matches `01-product-definition.md`'s explicit deferral of
  localization product-wide.
- MDX/CMS-backed authoring — see Content authoring above.
