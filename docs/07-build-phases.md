# 07 — Phase-by-Phase Build & Review Plan

The execution schedule. Phases are strictly ordered — each gate must pass
before the next phase starts. Every phase = implement → verify live →
update `SAAS_PLAN.md` with a dated entry → commit. Keep commits per phase
small and thematic (refactor moves separate from behavior changes).

Current tab labels/routes stay stable throughout; nothing here breaks a
shared invite link at any point.

---

## Phase 0 — Foundation refactor *(doc 03 is the spec)*
No visible change. Data-access layer, zod validation at all JSONB
boundaries, explicit column lists, public-page caching with tag
revalidation, directory restructure (`lib/blocks` vs `components/builder`,
route groups), naming cleanup, `email_sends`/`status`/`rsvp_deadline`
migration columns, builder bundle split.

**Gate:** doc 03 "Definition of done" in full — build passes, grep proofs
(no `select("*")`, no supabase access outside `lib/data/`, no JSONB `as`
casts), corrupt-block resilience test, five doc-01 use-case scripts pass
live, dashboard route JS no longer includes dnd-kit.

## Phase 1 — Studio design system *(docs 04, 05)*
Implement tokens in `globals.css` (paper/ink/green palette, type scale,
radius/shadow/motion tokens), Inter + Fraunces via next/font, re-skin every
`ui/` primitive + add Toast/Dropdown/Skeleton/Tooltip, drop Button
`outline` variant (migrate usages to secondary), icon audit. Then re-skin
Studio pages per doc 05: dashboard list (swatch-strip cards, RSVP counts,
card-click-through, overflow menu), auth split-screen pages, events/new +
settings on shared `EventDetailsForm` with live-preview theme picker,
guests tab re-skin (StatTile/Badge/Toast unification), workspace header +
account menu.

**Gate:** every Studio screen uses only doc-04 tokens (grep for hex values
outside `globals.css`/`themes.ts`); contrast script passes on all token
pairs; keyboard path works (tab/Esc/arrows) on dashboard, modals, menus;
mobile 390px pass of all Studio pages; build passes; live smoke of all host
flows.

## Phase 2 — Stage: guest themes & builder polish *(docs 04, 05)*
Theme system v2: `fonts` + optional `texture` on `Theme`, 4 new themes
(Garden Party, Ocean Air, Fiesta, Ink & Blush), `--t-font-*` vars, fonts
loaded only on Stage routes + builder preview. Guest-page block polish
pass (hero fluid display type, RSVP form controls on theme tokens,
countdown tabular digits, map mask, footer "Made with Ahvaan" line).
Builder UX consolidation: Style panel (Blocks/Style tabs; Theme + Page
scopes; custom-code presented as one feature), device-width preview
toggle, form-builder live preview, editor top-bar with unsaved-dot Save.

**Gate:** all 8 themes render correctly across every block type at 390px
and desktop (repeat the SAAS_PLAN block-by-block matrix on 2 old + 2 new
themes); pre-existing events (old theme ids, null schemas) render with
fonts applied and zero layout regressions; builder round-trip (edit → save
→ public page) verified per surface; build passes.

## Phase 3 — Marketing home page *(doc 06)*
Build `/` per blueprint: interactive theme-demo hero, three-step section,
alternating feature rows with component-built vignettes, theme gallery,
FAQ, CTA band, footer; metadata + OG image.

**Gate:** LCP < 1.8s and CLS < 0.1 on throttled 4G (Lighthouse ≥ 95
performance, ≥ 95 accessibility); theme demo works without layout shift;
reduced-motion honored; renders cleanly 390→1600px; all copy honest.

## Phase 4 — Feature completion *(doc 01 "New in v1" list — nothing else)*
- **Draft/published**: new events start draft; publish toggle + status
  Badge + URL/copy in Settings; public page 404s drafts except host
  preview (signed param or session check); dashboard card badge.
- **RSVP deadline**: Settings field; guest page swaps form for themed
  closed-note after deadline; server action also enforces it.
- **Image upload**: `event-images` Supabase Storage bucket (public-read,
  service-role write, per-host path prefix, 5MB/type limits); upload
  control wherever an image URL input exists (hero cover, image block);
  URL paste stays as fallback.
- **CSV export**: guests tab button → server-generated CSV (invites +
  responses, one column per form field, UTF-8 BOM).
- **Password reset**: full Supabase flow + `/reset-password` pages.

**Gate:** each feature's story from doc 01 verified live (incl. draft
invisible to logged-out + second host; deadline enforced server-side, not
just hidden; upload rejects oversize/wrong-type; CSV opens in
Excel/Numbers with custom fields correct); build passes; migration file
re-run safe.

## Phase 5 — Production hardening *(doc 08 is the spec)*
RLS policies as defense-in-depth, public-write abuse limits, error/
loading/not-found surfaces, Resend domain verification + delivered-email
test, SEO/OG for `/` and `/e/[slug]`, accessibility sweep, performance
budgets, deploy config.

**Gate:** doc 08 checklist 100% checked, each item with evidence noted in
SAAS_PLAN.md.

## Phase 6 — Launch QA
Full regression: the five doc-01 scripts plus draft/deadline/upload/export/
reset variants, executed on the production deployment with a fresh host
account, desktop + a real phone. Cross-browser: Chrome, Safari (macOS +
iOS), Firefox. Data check: no test rows left, indexes present, Supabase
backups (PITR) enabled. Then: tag `v1.0.0`, final SAAS_PLAN entry.

**Gate:** zero known P0/P1 defects; a stranger can complete the two-minute
event script unaided.

---

## Standing review policy (applies inside every phase)
- After each phase's implementation, run a structured self-review pass over
  the phase's diff (correctness, tenancy invariant, design-token
  compliance, a11y) *before* the live verification — fix, then verify.
- Any bug found post-gate gets a regression note in SAAS_PLAN.md with the
  root cause, same style as the Stage-5 alignment-pass documentation.
- Scope changes mid-phase require updating doc 01's matrix first; features
  drift in through docs, never through code.
