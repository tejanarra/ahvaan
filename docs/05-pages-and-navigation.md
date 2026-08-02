# 05 — Information Architecture, Navigation & Page Blueprints

Blueprint for every route in the finished product. Layouts reference the
design system (doc 04) tokens/components only.

## Site map & navigation model

```
PUBLIC (marketing route group)
  /                       Home (doc 06)
  /login  /signup  /reset-password
GUEST (stage)
  /e/[slug]               Public event page (?i=<inviteId> personalizes)
HOST (studio — requireHost)
  /dashboard              Events list
  /dashboard/events/new   Create event
  /dashboard/events/[id]  ┐ event workspace, tabbed:
    (index) Guests        │   Guests · Page · Form · Settings
    /design  Page         │   ("Invite page"→"Page", "RSVP form"→"Form" —
    /form    Form         │    shorter labels, same order)
    /settings Settings    ┘
SYSTEM
  not-found · error · loading per route group (Phase 5)
```

**Navigation rules**
- Exactly two Studio levels: the events list, and one event's workspace. No
  deeper. Breadcrumb is a single "← Events" link (as today).
- The Studio header (all dashboard pages): wordmark → `/dashboard`, right
  side: account menu **(new — replaces bare email + sign-out button)**: a
  Dropdown with the email as header, items: Sign out. Nothing else in v1.
- The event workspace header row: title (editable inline? **no** — edit in
  Settings, one way to do things), status Badge (Draft/Published, Phase 4),
  "View page ↗" (opens `/e/[slug]`; when draft, appends preview param).
- Guest pages have **no** Ahvaan chrome except a single discreet footer
  line: "Made with Ahvaan" linking home (this is the growth loop; keep it
  small, `text-caption`, theme-muted color).

## Page blueprints

### `/login`, `/signup`, `/reset-password` (rework, Phase 1)
Split-screen auth: left pane (45%, hidden on mobile) shows a Stage vignette —
a miniature themed invite card on the theme's background (rotates per load
among 3 themes); right pane on `--background`: wordmark, `text-display`
heading ("Welcome back" / "Create your account" / "Reset password"),
form (email, password, submit full-width primary), swap-link, inline error
via action state. Reset-password: request → emailed link → new-password form
(Supabase `resetPasswordForEmail` + update flow, Phase 4).

### `/dashboard` — Events list (re-skin, Phase 1)
- Header row: `text-title` "Your events" + primary "Create event".
- Grid of event cards (1/2/3/4 cols at sm/lg/xl). Card contents:
  **theme swatch strip** (6px tall, the event theme's accent→accentDark
  gradient — instant visual identity), title (`text-heading`, truncate),
  meta line (type · formatted date), status Badge (Phase 4), footer row:
  RSVP progress ("12 attending · 3 pending" — requires count query in data
  layer, cheap aggregate), overflow menu (Delete with confirm modal).
  Whole card clicks through to the workspace (not a "Manage" link).
- Empty state: display-serif "Plan something *lovely*" (italic accent word),
  one CTA. This is a new
  host's first screen — it must feel like an invitation itself.

### `/dashboard/events/new` (light rework, Phase 1)
Single centered column (`max-w-2xl`): shared `EventDetailsForm` (title,
subtitle, type, date, time, venue name/address, description) + theme picker.
Theme picker becomes **live mini-previews**: each option renders a small card
in that theme's real colors + display font ("Sample & Names" text), selected
state = accent ring. Submit → workspace `/design` tab (drop straight into
designing — stronger aha than the guests tab), event created as **draft**
(Phase 4).

### `/dashboard/events/[id]` — Guests tab (re-skin only, Phase 1)
Keep the built interaction design (stats tiles, tabs Invites/Responded,
search, sort, cards, edit dialog, share/copy, mail actions) — it's proven.
Re-skin to tokens; changes limited to:
- Stat tiles → `StatTile` spec; filter state gets accent-soft tint.
- Add invite: keep `ShareInviteButton` flow; success feedback → Toast.
- **CSV export button** (Phase 4) in the header row, secondary variant.
- Send-states (sent/error) unify on Badge + Tooltip (error message in
  tooltip), replacing color-only icon states.

### `/dashboard/events/[id]/design` — Page tab (re-skin, Phase 2)
Keep the fullscreen `fixed inset-0` editor decision and two-pane split
(420px panel + preview). Changes:
- Top bar: "← {event title}", center: nothing, right: "Save" primary +
  saved-state Toast; unsaved-changes dot on the Save button.
- Left panel: Blocks list (cards per doc 04 builder vocabulary) + "Add
  block" palette; **Style panel** consolidation (doc 01): panel gets two
  tabs — "Blocks" and "Style" — Style holds Theme (picker + color/font
  overrides), Page (pageStyle, custom page toggle) in PanelSections. Block-
  level style stays inside each block card (Layout + Advanced CSS
  PanelSection). This removes the current scattered entry points.
- Preview pane: canvas backdrop (dotted `--surface-sunken`), device toggle
  **(new, cheap)**: ToggleGroup Desktop/Mobile that constrains preview width
  to 390px — hosts constantly need this; guests are mobile.

### `/dashboard/events/[id]/form` — Form tab (re-skin, Phase 2)
Keep `[380px_1fr]` list+editor split and role-tag rules. Re-skin; field rows
get type icon + Badge for role-tagged fields; live preview of the rendered
form in the right pane **below the editor** (or as a third toggle) so hosts
see the guest's view without leaving.

### `/dashboard/events/[id]/settings` (light rework, Phase 1)
Shared `EventDetailsForm` + theme picker (same component as `new`), plus:
**Publish section** (Phase 4): status toggle + explanation + public URL with
copy button; **RSVP deadline** (Phase 4): optional datetime; **Danger zone**:
delete event (destructive card at bottom, confirm modal). Sections as Cards
with header rows, 32px rhythm, single column `max-w-2xl`.

### `/e/[slug]` — Guest page (Stage, Phase 2 polish)
Rendering model unchanged (theme vars + PageRenderer). Phase 2 adds:
- Theme fonts (`--t-font-display/body`) + optional texture overlay.
- Block polish pass to the Stage's standard: hero uses display font with
  fluid clamp sizes; RSVP form controls restyled on theme tokens (36px
  inputs, accent buttons, proper focus rings); countdown digits in tabular
  display font; map card gets `--radius-lg` mask.
- States: **draft** → 404 (unless host preview param, Phase 4);
  **deadline passed** → form replaced by a polite themed note ("RSVPs have
  closed — contact your host"); **no/invalid invite** → existing
  "By invitation" note, styled; **submitted** → confirmation state with
  guest's answers summary + "Change response" (exists; polish).
- A `generateMetadata` implementation: event title + subtitle as OG
  title/description (Phase 5; no guest names ever in meta).

### System pages (Phase 5)
`not-found.tsx` per group: Studio version (muted, "Back to events"), Stage
version (neutral paper, "This invitation isn't available"); root `error.tsx`
(apologetic, "Try again" reset button); `loading.tsx` with Skeletons for
dashboard list + workspace tabs.

## Responsive rules (global)
- Breakpoints: Tailwind defaults; design at 390 / 768 / 1280 / 1600.
- Studio is desktop-first but must be *usable* at 390px: builders degrade to
  stacked panel-over-preview with a segmented Edit/Preview toggle; guest
  dashboard cards stack; modals become bottom sheets.
- Stage is mobile-first, always; test every block at 390px first.
- Touch targets ≥ 40px on all guest-facing and mobile controls.
