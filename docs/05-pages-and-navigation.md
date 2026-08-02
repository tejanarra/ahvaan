# 05 — Information Architecture, Navigation & Page Blueprints

Blueprint for every route in the finished product. Layouts reference the
design system (doc 04) tokens/components only.

## Site map & navigation model

```
PUBLIC (marketing route group)
  /                             Home (doc 06)
  /login  /signup
  /forgot-password  /reset-password
  /terms  /privacy              Legal (own scroll column + PublicFooter,
                                 no sticky nav — see Navigation rules)
GUEST (stage)
  /events/[slug]                Public event page (?i=<inviteId> personalizes)
HOST (studio — requireHost)
  /dashboard                    Events list
  /dashboard/events/new         Create event
  /dashboard/events/[id]        ┐ event workspace: header band (← Events,
    (index) Guests → Data       │ title/badge/preview link) + a persistent
      /fields   Guests → Fields │ left SideNav (Guests · Invite page ·
      /actions  Guests → Actions│ Forms · Settings, desktop only). Guests'
    /design      Invite page    │ three sub-pages render a SectionNav pill
    /forms                      │ row (Data/Fields/Actions) in their own
      /forms/[formId]           │ PageHeader — see Navigation rules. Forms
        /fields /data /actions  │ list; each form workspace gets its own
    /settings    Settings       │ PageHeader + SectionNav pill row: Fields
                                 ┘ · Data · Actions. Settings is the ONE
                                     place for event-wide settings, including
                                     RSVP submission mode + deadline — no
                                     separate "Guests → Settings".
SYSTEM
  not-found · error · loading per route group
```

**Navigation rules**
- The event workspace has exactly three fixed zones, never duplicated: (1)
  the header band — "← Events" (the **only** back-arrow in the whole
  workspace) plus event title/badge/"View page ↗"; (2) a persistent left
  `SideNav` (desktop only) listing the four top-level sections (Guests ·
  Invite page · Forms · Settings) as flat links — it never nests a second
  level; (3) the content column, which opens with a shared `PageHeader`
  (crumb?/title/description?/actions?/nav?). A section's own sub-pages
  (Guests' Data/Fields/Actions; a form's Fields/Data/Actions) live as a
  `SectionNav` pill row in that page's `PageHeader.nav` slot, at every
  breakpoint — not in the sidebar, and not as a second full-width bar.
  `ToggleGroup` (bordered segmented control) is reserved for in-page
  filters/state and must never carry route navigation. There is exactly
  one Settings destination for an event (the top-level Settings page,
  covering visibility/details/RSVP rules/sharing/danger zone) — Guests has
  no separate "Settings" sub-page, since two same-named settings
  destinations in one workspace is confusing regardless of what's inside
  either.
- **Breadcrumb hard rule**: exactly one back-arrow exists anywhere in the
  event workspace — `← Events` in the header band. It never moves, never
  changes label. Anything else that shows "where you are" (e.g. the form
  workspace's "Forms" crumb in its `PageHeader`) is plain text, no arrow —
  a crumb, not a control. Guests' four pages and the Forms list get no
  crumb at all; the sidebar already names the section.
- Mobile (< 640px, sidebar hidden): a sticky pill strip under the header
  band lists the four top-level sections (reusing `SectionNav`'s scroll-
  strip behavior); a section's sub-pages still render in that page's own
  `PageHeader.nav` slot, same as desktop — the two rows never touch/stack
  since the page title sits between them.
- The Studio header (all dashboard pages): wordmark → `/dashboard`, right
  side: account menu: a Dropdown with the email as trigger (icon-only below
  `sm`), items: Sign out. Nothing else in v1.
- The event workspace header row: title (editable inline? **no** — edit in
  Settings, one way to do things), status Badge (Draft/Published),
  "View page ↗" (opens `/events/[slug]`; when draft, appends preview param).
- Guest pages have **no** Ahvaan chrome except a single discreet footer
  line: "Made with Ahvaan" linking home (this is the growth loop; keep it
  small, `text-caption`, theme-muted color).
- `/terms` and `/privacy` are not blueprinted as Studio or Stage pages —
  they're plain public documents. Each gets a wordmark link back to `/` at
  the top and the shared `PublicFooter` (Privacy/Terms/Sign in/Sign up
  cross-links) at the bottom, matching the marketing home page's footer.
  Deliberately no sticky nav header on these two routes — that would turn a
  legal document into a conversion surface.

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

### `/dashboard/events/[id]` — Guests section, Data sub-page (re-skin only, Phase 1)
Keep the built interaction design (stats tiles, tabs Invites/Responded,
search, sort, cards, edit dialog, share/copy, mail actions) — it's proven.
Re-skin to tokens; changes limited to:
- Stat tiles → `StatTile` spec; filter state gets accent-soft tint.
- Add invite: keep `ShareInviteButton` flow; success feedback → Toast.
- **CSV export button** (Phase 4) in the header row, secondary variant.
- Send-states (sent/error) unify on Badge + Tooltip (error message in
  tooltip), replacing color-only icon states.

### `/dashboard/events/[id]/design` — Invite page section (re-skin, Phase 2)
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

### `/dashboard/events/[id]/forms` — Forms section (Phase 2)
List of an event's custom forms (feedback, song requests, etc.) — separate
from the RSVP form, which lives under Guests → Fields. Each form opens its
own workspace at `/forms/[formId]` with a `SectionNav`: Fields · Data ·
Actions, keeping the same `[380px_1fr]` list+editor split and role-tag rules
as the Guests → Fields builder. Field rows get type icon + Badge for
role-tagged fields; live preview of the rendered form in the right pane
**below the editor** (or as a third toggle) so hosts see the guest's view
without leaving.

### `/dashboard/events/[id]/settings` — the one Settings destination
Shared `EventDetailsForm` + theme picker (same component as `new`), plus:
**Publish section**: status toggle + explanation + public URL with copy
button; **RSVP**: who can submit (private/anonymous/email-verified) and
optional RSVP deadline, together in one card — these used to be split
across two different "Settings" destinations (this page, and a separate
Guests → Settings sub-page), which read as confusing regardless of what
was in either; **Social sharing image**: cover image for link previews;
**Danger zone**: delete event (destructive card at bottom, confirm modal).
Sections as Cards with header rows, 32px rhythm, single column `max-w-2xl`.

### `/events/[slug]` — Guest page (Stage, Phase 2 polish)
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
