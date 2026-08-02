# Invitely — SaaS invite platform (plan + progress)

This file is the single source of truth for this branch/worktree. It exists
so work can resume here — in a new session, or without me — without needing
to reconstruct context from chat history.

**Where this lives**: this is a separate git worktree
(`/Users/tejanarra/Developer/RSVP-saas`, branch `saas`), deliberately
isolated from `/Users/tejanarra/Developer/RSVP` (branch `main`, the original
single-tenant wedding app). Each folder has its own `node_modules` and its
own `.env.local` — nothing here touches `main`'s app or its Supabase
project. See "Worktree notes" at the bottom for how that's wired up.

## What this product is

Turning the original single-event wedding RSVP app into a real multi-tenant
SaaS: any host signs up, creates an event of any type, picks a theme, sends
guests personal invite links, tracks RSVPs, and (soon) emails invites and
reminders. Free, no billing.

## Product decisions already made (don't re-litigate these)

- **Auth**: real per-host accounts (Supabase Auth), not a shared password.
- **Event scope**: any event type (wedding/birthday/baby shower/party/
  other), not wedding-specific — a host picks a type + theme per event.
- **v1 feature set**: themed invite designer (curated theme picker) + RSVP/
  guest-list management (porting what already existed on `main`) + email
  sending (invites + manual reminders). **Superseded by Stage 5** (below):
  the host asked for real page/form customization, so there's now also a
  drag-and-drop page block editor and a fully editable RSVP form builder.
- **Explicitly deferred still**: guest comments/well-wishes wall, photo
  sharing/shared album, automatic scheduled reminders (cron), any
  billing/paid plans, and host-authored custom HTML/CSS/JS (planned as a
  future sandboxed-iframe block — see Stage 5's "not built now" section).
- **Authorization model**: every query goes through the service-role
  Supabase client server-side (same as `main` always did) — never RLS
  policies enforcing tenancy. Every table has `host_id` denormalized onto
  it, and every host-facing query/action filters `.eq("host_id", userId)`
  in application code, where `userId` comes from a server-verified Supabase
  Auth session. RLS is enabled on every table with **no policies**, purely
  as a backstop (anon/authenticated keys have zero access either way).
  This was a deliberate choice to avoid introducing a second authorization
  model (RLS policies) in the same change as introducing real accounts —
  it's a clean, separable hardening step for later, not required for
  correctness now.

## Data model

Run `supabase/schema-saas.sql` once in your Supabase project's SQL editor —
it's idempotent (`create table if not exists` / `add column if not exists`)
and already includes RLS enable statements. Tables: `events`, `invites`,
`rsvps`, `email_sends`, all with `host_id uuid references auth.users(id)`.
Since Stage 5, `events` also has `form_schema jsonb` and `page_schema
jsonb` (both nullable — null means "use the default"), and `rsvps` has
`responses jsonb not null default '{}'`. **If you already ran this file
before Stage 5**, re-run it — the new columns are added via idempotent
`alter table ... add column if not exists` statements at the bottom, so
re-running is safe and won't touch existing data.

## Setup checklist (what you need to do before this runs)

1. Create a new Supabase project (separate from `main`'s).
2. Run `supabase/schema-saas.sql` in its SQL editor.
3. In that project's Auth settings, turn off "Confirm email" — otherwise
   signup won't establish a session immediately (see `src/lib/auth-actions.ts`
   for how that's handled either way, but disabling it makes local testing
   frictionless).
4. Copy `.env.example` to `.env.local` **in this folder**
   (`/Users/tejanarra/Developer/RSVP-saas/.env.local` already exists as a
   blank copy) and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — only needed for Stage 4
     (email sending); everything else works without them.
5. `npm install` (already done once, but re-run if `package.json` changes).

Nothing else in this repo needs those values hardcoded anywhere — they're
only ever read from `process.env`.

## Status: what's built (Stage 1 + 2 — committed, `npm run build` passes)

**Auth** (`@supabase/ssr`-based, replaces the old `ADMIN_PASSWORD` +
signed-cookie system entirely — that system, `src/lib/session.ts`, and the
old `/admin` route are deleted, not just unused):
- `src/lib/supabase/auth-server.ts` — `createAuthServerClient()` (session-
  aware server client) and `requireHost()` (redirects to `/login` if no
  session; returns the Supabase `user` object otherwise — this is what
  every dashboard route/action calls first to get a real `host.id`).
- `src/lib/auth-actions.ts` — `login`, `signup`, `logout` server actions.
- `src/proxy.ts` — middleware protecting `/dashboard/:path*`, refreshes the
  Supabase session cookie on every matched request.
- `src/app/login/page.tsx`, `src/app/signup/page.tsx` — forms using
  `useActionState`.

**Dashboard shell**:
- `src/app/dashboard/layout.tsx` — calls `requireHost()`, renders header +
  sign-out.
- `src/app/dashboard/page.tsx` — lists the signed-in host's events
  (`.eq("host_id", host.id)`), "Create event" CTA, delete-event button per
  card.
- `src/app/dashboard/events/new/page.tsx` + `src/app/dashboard/actions.ts`
  (`createEvent`) — title/subtitle/type/date/time/venue/description +
  theme picker (visual swatch grid from `src/lib/themes.ts`). On success,
  redirects to the new event's detail page.
- `src/app/dashboard/events/[eventId]/page.tsx` +
  `event-settings-panel.tsx` — view/edit/delete a single event
  (`updateEvent`/`deleteEvent` in `src/app/dashboard/actions.ts`, both
  double-checking `host_id = host.id`). Has a placeholder box where the
  guest dashboard goes next.

**Shared/config**:
- `src/lib/themes.ts` — 4 curated themes (Classic Gold, Modern Minimal,
  Playful Pastel, Midnight Elegant), color tokens only (all themes share
  one font pairing for now — see "Scope notes" below).
- `src/lib/event-types.ts` — the 5 event-type options + label lookup.
- `src/lib/event.ts` — `EventRecord` type + `makeEventSlug()` (slugify +
  random suffix, used on event creation).
- `src/components/icons.tsx`, `src/components/confirm-icon-button.tsx` —
  ported from the old `main`-branch admin dashboard, used by both the
  dashboard shell today and the guest-dashboard components to be ported in
  next.
- `src/app/page.tsx` — new marketing landing page (was the hardcoded
  wedding guest page).

**Verified end-to-end** (real Supabase credentials in `.env.local`, tested
live in a browser): `npm run build` passes; signup creates a session
immediately; create event → theme picker → settings edit/delete all work;
Stage 3 guest dashboard + public RSVP flow (below) verified working;
second-host tenancy isolation confirmed (`/dashboard` empty for a new host,
direct `/dashboard/events/<other-host's-id>` 404s via `notFound()`).

## Status: what's built (Stage 3 — committed, `npm run build` passes)

**A. Guest dashboard, ported into `/dashboard/events/[eventId]`**

Ported from `main`'s `src/app/admin/` (guest-dashboard.tsx, guest-card.tsx,
edit-rsvp-dialog.tsx, copy-share-icons.tsx, invite-link.ts) into
`src/components/guest-dashboard/`, generalized to `(eventId, event.slug,
event.title)`-scoped data instead of one global invite/RSVP model:
- Queries filter `.eq("event_id", eventId).eq("host_id", host.id)` (see
  `src/app/dashboard/events/[eventId]/page.tsx` and
  `src/app/dashboard/events/[eventId]/actions.ts` — `createInvite`,
  `deleteInvite`, `deleteRsvp`, `updateRsvp`, each host_id-checked).
- `invite-link.ts`'s `buildInviteLink(eventSlug, inviteId)` builds
  `/e/{slug}?i={inviteId}` links.
- Wired into `src/app/dashboard/events/[eventId]/page.tsx`, replacing the
  old placeholder div, alongside a `ShareInviteButton` to generate invites.

**B. Public themed event page + guest RSVP flow**

- `src/app/e/[slug]/page.tsx` — public Server Component, looks up the event
  by slug, reads `?i=<inviteId>`, resolves an existing RSVP if present, and
  wraps the page in theme CSS custom properties (`--t-bg`, `--t-fg`,
  `--t-accent`, `--t-accent-dark`, `--t-surface`) driven by
  `getTheme(event.theme_id)` from `src/lib/themes.ts`.
- `src/app/e/[slug]/event-view.tsx` — themed cover (title/subtitle/date/
  venue/description) + either the RSVP form (valid invite) or a "By
  Invitation Only" note.
- `src/app/e/[slug]/rsvp-form.tsx` + `src/app/e/[slug]/actions.ts`
  (`submitRsvp`) — generalized from the old root `actions.ts`/
  `rsvp-form.tsx` to the `events`/`invites`/`rsvps` schema, upserting on
  the `invite_id` unique constraint; `host_id` on the RSVP row comes from
  the invite row itself, never trusted from the client.
- `src/components/venue-map.tsx` — generalized Google Maps embed, takes
  venue name/address as props instead of the hardcoded `wedding.ts`
  constant (which is now deleted).
- Deleted the reference-only leftovers once (A) and (B) were verified:
  `src/app/actions.ts`, `src/app/invite-book.tsx`, `src/app/rsvp-form.tsx`,
  `src/app/venue-map.tsx`, `src/lib/wedding.ts`.

<details>
<summary>Stale planning notes from before Stage 3 (kept for history, no longer accurate — see "what's built" above)</summary>

On `main`, `src/app/admin/` had a fully-built, already-polished guest
management UI (tabs for Invites/Responded, sub-filter, search, sort,
clickable stats, icon-only card actions, an Edit RSVP dialog). It was
**deleted** on this branch (not ported) because it depended on the old
single-tenant schema (`invites`/`wedding_rsvps` tables with no `host_id` or
`event_id`) and the old admin actions. To resurrect it here:

1. Pull the reference implementation from `main` for the shapes/UX (or
   `git show main:src/app/admin/guest-dashboard.tsx` etc. from this
   worktree — `main` is a sibling branch, fully accessible via git even
   though it's checked out in the other folder):
   `guest-dashboard.tsx`, `guest-card.tsx`, `edit-rsvp-dialog.tsx`,
   `copy-share-icons.tsx`, `invite-link.ts`. `icons.tsx` and
   `confirm-icon-button.tsx` are already ported into `src/components/`.
2. Move them into `src/components/guest-dashboard/` on this branch.
3. Generalize every reference from a single global invite/RSVP model to
   `(eventId, ...)`-scoped data:
   - `PendingInvite`/`RespondedGuest` types gain nothing new structurally,
     but the **queries that populate them** must filter
     `.eq("event_id", eventId).eq("host_id", host.id)` (see
     `src/app/dashboard/actions.ts` for the `requireHost()` +
     service-role-client pattern already used elsewhere on this branch).
   - `invite-link.ts`'s `buildInviteLink` needs the event's `slug`, not a
     bare origin — the guest link becomes `/e/{slug}?i={inviteId}`, not
     `/?invite={inviteId}`.
   - New server actions in `src/app/dashboard/events/[eventId]/actions.ts`:
     `createInvite(eventId, name)`, `deleteInvite(inviteId)`,
     `deleteRsvp(rsvpId)`, `updateRsvp(rsvpId, payload)` — same shapes as
     the old `src/app/admin/actions.ts` (already deleted, but the pattern
     is documented above and in git history on `main`), each verifying
     `host_id = host.id` before mutating, matching `updateEvent`/
     `deleteEvent`'s existing pattern in `src/app/dashboard/actions.ts`.
4. Wire the result into `src/app/dashboard/events/[eventId]/page.tsx`,
   replacing the "Guest list... lands here next" placeholder div.

**B. Public themed event page + guest RSVP flow**

1. `src/app/e/[slug]/page.tsx` — Server Component: look up the event by
   `slug` (public, no auth — this is the guest-facing page), read
   `?i=<inviteId>` from `searchParams` (same `Promise<{...}>` async pattern
   used in the old `src/app/page.tsx` on `main`, and still present in this
   branch's leftover `src/app/actions.ts`/`invite-book.tsx` for reference).
   Render the event's cover/details themed by `getTheme(event.theme_id)`
   from `src/lib/themes.ts`, and the RSVP form when a valid invite id
   resolves to a row in `invites` for that event.
2. `src/app/e/[slug]/actions.ts` — `submitRsvp(eventId, inviteId, payload)`,
   generalized from the old root `src/app/actions.ts`'s `submitRsvp`
   (still present in this branch, unused — good reference for the
   validation/upsert-on-conflict pattern, but it references the old
   `invites`/`wedding_rsvps` tables and needs updating to `events`/
   `invites`/`rsvps` with an `event_id` + `invite_id` unique constraint
   check).
3. Reuse the interaction patterns (not necessarily the exact files) from
   this branch's still-present but currently-unused
   `src/app/invite-book.tsx` (swipeable/scrollable cover+details+RSVP
   layout) and `src/app/rsvp-form.tsx` (attending yes/no toggle + dynamic
   `{key, value}` plus-one fields — this exact pattern was deliberately
   reused for the admin-side Edit RSVP dialog on `main` too, for the same
   reason: it already fixed a "removes the wrong plus-one" bug by keying
   on a stable id instead of array index). Generalize them to take
   event/theme data as props instead of hardcoded Swathi & Sai Teja copy
   and gold/lavender colors.
4. `src/app/venue-map.tsx` + `src/lib/wedding.ts` (both still present,
   unused) show the Google Maps embed pattern to generalize — venue name/
   address should come from the `events` row instead of the hardcoded
   `wedding.ts` constant.

Once (A) and (B) both work, delete the leftover unused files:
`src/app/actions.ts`, `src/app/invite-book.tsx`, `src/app/rsvp-form.tsx`,
`src/app/venue-map.tsx`, `src/lib/wedding.ts` — they're intentionally left
in place right now purely as implementation reference, not because they're
wired into anything.

</details>

## Status: what's built (Stage 4 — committed, `npm run build` passes)

- `src/lib/email.ts` — Resend client wrapper: `sendInviteEmail(event,
  invite)`, `sendReminderEmail(event, invite)`. Builds the invite link via
  `NEXT_PUBLIC_SITE_URL` (new env var — server-side code has no
  `window.location`, so the origin can't come from the browser the way it
  does for the dashboard's copy/share buttons).
- `invites.email` is now populated from the UI: `ShareInviteButton` has an
  optional email field, threaded through `createInvite(eventId, name,
  email?)`.
- `src/app/dashboard/events/[eventId]/actions.ts` — `sendInviteEmail(eventId,
  inviteId)` and `sendReminderEmails(eventId)` (bulk, skips invites that
  already have an RSVP or no email on file), both host_id-checked and
  logging every attempt to `email_sends` (kind: 'invite' | 'reminder',
  status `sent` or `failed: <message>`) — including failures, not just
  successes, so the log is a real audit trail.
- UI: a mail icon on pending invite cards (only shown when the invite has
  an email) that sends now and shows sent/error state inline, plus an
  "Email all pending (N)" button above the Invites list showing "Sent X of
  Y" after a bulk run.

**Verified**: the send path is wired correctly end-to-end (invite created
with email → mail icon click → server action → Resend API call → result
written to `email_sends` → UI reflects sent/error state) — confirmed via
the *error* path in this Resend account: `RESEND_FROM_EMAIL`
(`notifications@invitely.tejanarra.space`) is on a domain
(`invitely.tejanarra.space`) that isn't registered/verified in this Resend
account yet (only `punch.tejanarra.space` is, and its domain status is
itself `partially_failed`) — Resend's API correctly rejected the send with
a domain-verification error, and the app correctly surfaced that error in
`email_sends` and the mail-icon UI (turned red, error in the tooltip)
instead of silently failing. **Not yet verified**: an actual delivered
email, since that needs a verified sending domain — add/verify
`invitely.tejanarra.space` (or point `RESEND_FROM_EMAIL` at the
already-registered `punch.tejanarra.space` once its own verification is
fixed) in the Resend dashboard, then retry from a pending invite's mail
icon.

## Status: what's built (Stage 5 — fully customizable invite pages)

Full plan/design rationale is in the (session-local) plan file this was
built from; this section is the durable summary.

**Form builder** (any field — including the built-in name/attending/
plus-ones — can be relabeled, reordered, or deleted, not just appended to):
- `src/lib/form-schema.ts` — `FormField`/`FormSchema`/`Responses` types, a
  `role: "name" | "attending" | "plus_ones" | null` tag that lets the app
  find "the field that means attending" even after a host relabels it,
  `resolveFormSchema` (null → sensible 3-field default), `getFieldValue`
  (reads `responses` first, falls back to the legacy scalar columns by
  role — so pre-Stage-5 RSVPs keep rendering correctly), `deriveLegacyScalars`
  (keeps `rsvps.name`/`attending`/`additional_guests` populated forever as a
  fast-path/historical fallback, not just during a migration window).
- `src/lib/rsvp-validation.ts` — shared required/option-membership
  validation used by both the guest submit action and the host edit action,
  so neither path can save data the other would reject.
- Guest side: `src/app/e/[slug]/rsvp-form.tsx` renders any field generically
  by `field.type` (text/textarea/select/radio/checkbox/plus_ones);
  `actions.ts`'s `submitRsvp` validates and derives both `responses` and the
  legacy scalars in one upsert.
- Host side: `src/app/dashboard/events/[eventId]/form-builder-panel.tsx` —
  add/edit/delete/reorder fields; role-tagged fields keep their type/options
  locked (so "attending" always means a trustworthy yes/no) but can still be
  relabeled or deleted — deleting one is what makes the dashboard degrade
  (see below), not a dead end. `updateFormSchema` action added to the
  event's `actions.ts`.
- Dashboard degradation: `dashboard/events/[eventId]/page.tsx`'s stats
  (`attending`/`declined`/`totalGuests`) are `null` when the event has no
  `role`-tagged field for them, and `guest-dashboard.tsx` hides the
  corresponding stat tiles/filter buttons instead of showing a meaningless
  0 — confirmed working for both "field relabeled" (stats keep working) and
  "field deleted" (stats hide, no crash).

**Drag-and-drop page builder** (visual editor for the guest-facing
`/e/[slug]` page layout):
- Added `@dnd-kit/core`/`@dnd-kit/sortable`/`@dnd-kit/utilities`.
- `src/lib/page-blocks/` — `types.ts` (`PageSchema`/`BlockInstance`
  discriminated union: hero, text, image, spacer, countdown, rsvp-form,
  venue-map), `registry.tsx` (`BLOCK_REGISTRY`, the single place a new block
  type — like the future sandboxed custom-HTML block — plugs in without
  touching the renderer or builder), `page-renderer.tsx` (maps a schema's
  blocks through the registry for the public page), `blocks/*.tsx` (one
  file per built-in type; `rsvp-form.tsx` and `venue-map.tsx` are thin
  adapters over the existing `RsvpForm`/`VenueMap` components).
- `src/app/e/[slug]/page.tsx` branches on `event.page_schema`: non-null →
  `<PageRenderer>`, null → the original fixed `<EventView>` (kept, not
  deleted — the permanent backward-compat path for events that never open
  the builder).
- New events get a seeded default `page_schema` (hero + rsvp-form +
  venue-map, mirroring the old fixed layout) at creation time
  (`dashboard/actions.ts`'s `createEvent`); older events still `null` get
  the same default seeded **in-memory** when a host opens the builder
  (not persisted until they hit Save), so it never opens on a blank canvas.
- `src/app/dashboard/events/[eventId]/design/` — `page.tsx` (loads the
  event, seeds the default schema if needed) + `page-builder.tsx` (dnd-kit
  sortable block list with per-block inline editors from the registry, a
  "+ Add block" palette, delete via the existing `ConfirmIconButton`, a live
  preview pane rendering the same `<PageRenderer>` in the event's real
  theme, and an explicit Save button — `updatePageSchema` action added to
  the event's `actions.ts`). Linked from a "Open page builder →" link on
  the main event page next to `EventSettingsPanel`.

**Custom HTML/CSS/JS block** (originally planned as later phase, built now
per host request): `src/lib/page-blocks/blocks/custom-html.tsx` —
`CustomHtmlConfig = { html, css, js, heightPx }`, edited via 3 code
textareas + a frame-height number input, rendered on the public page as a
single self-contained `<iframe srcDoc={...}>` combining all three. The
security property that matters: `sandbox="allow-scripts"` **without**
`allow-same-origin` — the frame gets scripting ability but a unique opaque
origin, so host-authored code can run but can never read guest
cookies/sessions/localStorage, reach the parent page's DOM, or touch any
other host's data. `referrerPolicy="no-referrer"` as an extra precaution.
No external `<script src>`/stylesheet loading is exposed by the editor —
everything is inlined into one `srcDoc`, so there's no way to pull in a
third-party origin from this block. Registered in `BLOCK_REGISTRY` like
every other block — confirms the registry design worked as intended (one
new entry, zero changes to the renderer/builder/public page).

**Per-block size/alignment** (any block — text, image, or any other —
gets a Width (S/M/L/Full) and Align (left/center/right) control):
`src/lib/page-blocks/types.ts`'s `BlockLayout = { align, width }`, stored
as an optional `layout` field on every `BlockInstance`. `layout-controls.tsx`
has the shared `<LayoutControls>` editor UI (used generically by every
block card in the builder, no per-block-type wiring needed) and
`layoutWrapperStyle()`, which `page-renderer.tsx` uses to wrap every
block's `Render` output in a sizing/alignment `<div>` — individual block
components never need to know layout exists. Getting this to actually
take effect required stripping the hardcoded `max-w-xl`/`max-w-md` a few
blocks (hero, countdown, text, custom-html) had on their own root element
— nested CSS `max-width`s compose via the *smaller* one winning, so a
block's own internal cap silently overrode the new wrapper until removed.
RSVP-form and venue-map deliberately keep their own internal max-width
(form fields and a fixed-height map don't look right stretched
edge-to-edge) — their width control still works to shrink, just not to
exceed their built-in comfortable size.

**Nestable Container block** (host request: "nest elements like HTML
elements and add CSS to them"): a `"container"` block type
(`src/lib/page-blocks/blocks/container.tsx`) holds its own `children:
BlockInstance[]` array — any other block type, including another
container — plus `background`/`paddingPx`/`customStyle` config.
`customStyle` is raw text like `border-radius: 16px; box-shadow: ...` —
deliberately parsed into a React inline-style object
(`layout-controls.tsx`'s `parseInlineStyle`), **not** injected as a
`<style>` tag, so a host can only style the one container element, never
add selectors that reach anything else on the page (unlike the sandboxed
custom-html block, this isn't iframe-isolated, so keeping it to inline
styles only — no selectors, no script — is what keeps it safe without a
sandbox). Recursion without a circular import: `BlockDefinition`'s
`Edit`/`Render` prop types gained optional `childBlocks`/`renderBlock`/
`renderChildList` props that only the container's own components read;
`page-renderer.tsx` recurses through `BLOCK_REGISTRY` for `Render`, and
`page-builder.tsx` extracted a reusable `<BlockListEditor>` (sortable
list + add-block palette) used both at the page's top level and, via
`renderChildList`, inside every container — reordering/adding/removing
works identically at any nesting depth via its own independent
`DndContext`.

**Desktop layout pass** (initial): the dashboard was capped at `max-w-5xl`
(1024px) on every page via a single wrapper in `dashboard/layout.tsx`, so
the page builder's two-pane editor and the form builder's field list were
both squeezed into roughly half of an already-narrow column — cramped on
any real desktop monitor. Fixed by removing that blanket cap and letting
each page own its width: event list/detail pages now use up to
`max-w-6xl`/`max-w-[1600px]`; the form builder's field editing changed
from an inline-accordion-per-row (forced long vertical stacking) to a
`[380px_1fr]` list+editor split; the guest card grid gained an
`xl:grid-cols-4` step; `EventSettingsPanel`'s "Open page builder" link was
merged into its existing header row instead of being its own stacked
block.

**Page builder UI pass** (follow-up, after the host flagged the first
pass as still looking bad and pointed out no HTML/CSS nesting existed
yet): reworked into a fixed-height two-pane editor —
`h-[75vh] min-h-[480px] max-h-[900px]` "Blocks" panel and "Live preview"
panel, each independently scrollable (`overflow-y-auto` on the inner
content, not the whole page), `[420px_1fr]` split at the `xl` breakpoint.
Block cards collapse to a single row (drag handle, name, expand arrow,
delete) and expand in place to show layout controls + the block's own
config — replacing the earlier design's problem of the whole sidebar
needing scroll just to see one open block's settings.

**Migration note**: this adds 3 new columns (`events.form_schema`,
`events.page_schema`, `rsvps.responses`) — see "Data model" above for how
to apply them to an already-provisioned Supabase project.

**Alignment/scroll bug-fix pass** (follow-up, after the host reported a
hydration warning, a block visibly not centering despite "center" being
selected, and "if I change the RSVP form size it changes the alignment"):

- SSR hydration mismatch: dnd-kit's `DndContext` assigns its
  `aria-describedby` id from a module-level counter that can differ
  between server-render and client-hydrate (order-dependent, worse with
  nested containers). Fixed by deferring the whole `<DndContext>` tree in
  `page-builder.tsx`'s `BlockListEditor` to render only after client mount,
  showing an `animate-pulse` placeholder for one paint first.
- `align-self` + an explicit `width: 100%` on a flex item resolves against
  an ambiguous reference size in some browsers, visibly shifting "centered"
  blocks off-center. Fixed by switching `layout-controls.tsx`'s
  `layoutWrapperStyle` from `align-self` to `margin: auto`-based
  positioning (unambiguous, block-level).
- Blocks that keep their own smaller internal max-width (rsvp-form,
  venue-map, hero's cover image/description, image with `maxWidthPx`) only
  had their *wrapper box* repositioned by the margin fix above — the
  *content inside* still defaulted to flow-left since nothing told it to
  follow the chosen align. Two different fixes were needed depending on
  where the narrower content sits:
  - When the narrower content **is** the wrapper's direct child (rsvp-form,
    venue-map): added `display: flex; justifyContent: <align>` to the same
    wrapper style — repositions the content within the box, no-op for
    `w-full` blocks (hero/text/image/custom-html) since a 100%-width flex
    child leaves nothing to justify.
  - When the narrower content is nested **inside** a `w-full` block
    (hero's cover image and description, both wrapped in a plain `<div
    className="w-full">`): the wrapper's own `justify-content` can't reach
    that deep, so instead switched those elements from `mx-auto` (always
    centers, ignores align) to `inline-block` with no explicit margin —
    inline-level boxes follow the parent's inherited `text-align`, which
    `layoutWrapperStyle` already sets correctly per-align.
  - Image block's `<img>` had a matching hardcoded `mx-auto`, removed for
    the same reason (only mattered once `maxWidthPx` narrows it below the
    wrapper).
- Went block-by-block (host's explicit ask: "check each component one by
  one ... fix one by one") and found two more duplicate/conflicting
  alignment controls that fought the generic wrapper instead of trusting
  it:
  - Text block had its own legacy `config.align` ("left"/"center" only)
    hardcoding a Tailwind `text-left`/`text-center` class on the `<p>`,
    which silently overrode the wrapper's `textAlign` for every text block
    ever created. Removed the field and the duplicate Left/Center buttons
    entirely — text now inherits alignment from the shared `LayoutControls`
    like every other block.
  - Countdown block's digit row was hardcoded `flex justify-center`, so
    picking "left"/"right" moved the label above it but left the digits
    centered. Changed to `inline-flex` (no `justify-center`) so the digit
    row follows the same inherited `text-align` as the label.
- Page-builder scroll/dead-space bug (host screenshot: visible gap below
  the two panels plus a second, redundant page-level scrollbar): the
  panels used a guessed `h-[75vh] min-h-[480px] max-h-[900px]` that didn't
  match the *actual* remaining viewport height after the shared dashboard
  header. Fixed by restructuring `dashboard/layout.tsx` into a real
  `h-screen flex flex-col` shell (`<main>` = `flex-1 min-h-0
  overflow-y-auto`, the single scroll container for every dashboard page)
  and changing `page-builder.tsx`'s panels to `h-full`/`flex-1 min-h-0` +
  CSS Grid's default stretch instead of any `vh` arithmetic — eliminates
  the outer scroll entirely since the panels now size against a
  well-defined height rather than a guess.

Verified live in the browser, block by block, across Width (S/M/L/Full) ×
Align (left/center/right) combinations: Hero (incl. cover image and
description once a cover/description was set), RSVP form, Venue map, Text,
Image, Countdown, Container (including a nested child block's own
independent alignment), and Custom HTML/CSS/JS (confirmed no bug — it has
no internal max-width, so the wrapper alone always positions it).

## Verification plan

1. ✅ `npm run build`.
2. ✅ Sign up a test host, create an event, confirm the theme picker and
   settings edit/delete all work (Stage 1+2).
3. ✅ Stage 3: generate an invite, open its link in a separate tab, submit
   an RSVP (attending + a plus-one), confirm it shows up back in the
   event's guest dashboard with stats/search/sort/tabs/edit all working,
   and confirm the public page is themed per the event's chosen theme
   (tested with Playful Pastel, distinct from the default Classic Gold).
4. ✅ Signed up a **second** test host and confirmed they cannot see or
   reach the first host's events (`/dashboard` empty for them; direct
   `/dashboard/events/<other-host's-id>` 404s via `notFound()`) — the core
   multi-tenancy check, since the authorization model relies on
   code-level `host_id` filters rather than RLS policies.
5. ⏳ Stage 4: send path verified end-to-end except actual delivery, which
   is blocked on Resend domain verification (see "what's built" above) —
   re-run once `RESEND_FROM_EMAIL`'s domain is verified, confirm the link
   in the received email works.
6. ✅ Stage 5: schema migration applied to the live Supabase project;
   `npm run build` passes. Verified live (host `spuskoori+desktoptest@stradaji.com`,
   event "Desktop UI Test"): opened the form builder, deleted the
   plus-ones field, added a custom "Meal preference" text field — the
   guest RSVP form correctly rendered the new field set (no plus-ones,
   custom field present, name prefilled from the invite), submitted
   successfully, and the dashboard reflected it (Attending: 1, no
   "Guests" tile since plus-ones was removed, guest card showing "Meal
   preference: Vegetarian" generically). Opened the page builder, added
   the new custom-HTML/CSS/JS block with an inline script, confirmed it
   executes inside the sandboxed iframe (visually, plus confirmed
   `iframe.contentDocument` is inaccessible from the parent page — proof
   the origin isolation is real, not cosmetic), saved, and confirmed the
   block persists and still executes on the public page after a fresh
   load. Also confirmed the desktop layout fixes: dashboard pages, the
   page builder's sidebar+preview split, and the form builder's
   list+editor split all render using the full available width instead
   of a narrow centered column.

Test data from the Stage 3 pass (host `spuskoori+stage3test@stradaji.com`,
event "Test Birthday Bash"), the Stage 4 pass (host
`spuskoori+stage4test@stradaji.com`, event "Stage 4 Email Test"), and the
Stage 5 pass (host `spuskoori+desktoptest@stradaji.com`, event "Desktop UI
Test") was deleted afterward; the extra host account
`spuskoori+stage3host2@stradaji.com` used for the tenancy check was left
as-is (harmless, has zero events).

## Scope notes / things deliberately simplified for v1

- All 4 themes share one font pairing — only colors differ per theme. A
  full per-theme font system or visual designer is real scope on its own;
  explicitly deferred.
- `makeEventSlug()` appends a random suffix rather than retrying on a
  unique-constraint collision — collision odds are astronomically low at
  this scale, so a single insert attempt is fine.
- No rate limiting on login/signup — Supabase Auth has its own built-in
  rate limits (unlike the old admin login's hand-rolled in-memory limiter,
  which doesn't apply here).

## Worktree notes

Two independent folders, same repo:
- `/Users/tejanarra/Developer/RSVP` — branch `main`, original single-
  tenant app, its own untouched `.env.local`.
- `/Users/tejanarra/Developer/RSVP-saas` (this folder) — branch `saas`.

They share git history/objects but have separate working directories,
`node_modules`, and `.env.local` files — editing/running one never affects
the other. `git worktree list` (run from either folder) shows both.
Standard git commands (`git add`, `git commit`, `git push`, `git log`) work
normally from within this folder against the `saas` branch, same as any
other checkout.

## Status: docs/ planning folder + Ahvaan rebrand assets (2026-07-30)

- Added `docs/` (01–09 + README): the canonical forward-looking plan
  (architecture review/target, Phase-0 restructure spec, design system,
  page blueprints, home page, phase plan with gates, production checklist,
  brand doc). `CLAUDE.md` at the repo root points every future session at it.
- Product renamed **Invitely → Ahvaan** (host's pick after a web-verified
  naming audit — full candidate/rejection table in
  `docs/09-brand-and-favicon.md`; "Invitely" collides with existing RSVP
  apps on both app stores).
- Brand assets built and wired in (`npm run build` passes): theme-aware
  `src/app/icon.svg` favicon + new `icon.png` (512) / `apple-icon.png`
  (180) replacing the old wedding icons; `src/components/brand.tsx`
  (BrandMark + BrandLockup, Fraunces wordmark via new `--font-fraunces` in
  the root layout) used in the dashboard header, landing header, and auth
  pages; root metadata now Ahvaan (old wedding OG image and unused
  wedding photos in `public/` deleted).

## Status: Phase 0 — foundation refactor (2026-07-30)

Executed `docs/03-codebase-restructure.md` in full (pure refactor, no
user-visible behavior change):

- **Data-access layer** (`src/lib/data/{events,invites,rsvps,email-log}.ts`):
  every Supabase query now lives here — every host-scoped function takes
  `hostId` and applies `.eq("host_id", hostId)`; explicit column lists
  everywhere (`listEvents` no longer pulls `form_schema`/`page_schema`
  jsonb for the dashboard cards); typed `NotFoundError`/`DataError`.
  `getEventBySlugPublic` is `unstable_cache`d and tagged `event:{slug}`,
  invalidated by every mutating action via `revalidateEventCache`.
- **Validation layer** (`src/lib/schemas/`): added `zod`. New
  `page-schema.ts` gives `page_schema` real structural validation for the
  first time (previously only checked "has a non-empty blocks array" and
  cast the rest) — invalid individual blocks are dropped with a
  server-side warning instead of crashing the guest page; verified live
  with a hand-corrupted block type. `event-input.ts` validates
  create/update event fields. `form-schema.ts`/`responses.ts` moved here
  from `lib/` unchanged (already had real hand-rolled validation) plus a
  new `assertResponsesWithinSizeBudget` (64KB cap) wired into both the
  guest submit and host edit paths.
- **Directory restructure**: `lib/page-blocks` → `lib/blocks` (pure:
  types/registry/renderer/block components, importable from the public
  page); editor-only `layout-controls-ui.tsx` → `components/builder/`;
  `lib/event.ts` merged into `lib/data/events.ts`.
- **Naming cleanup**: the `sendInviteEmail` action/lib-function name
  collision resolved — lib functions renamed `deliverInviteEmail`/
  `deliverReminderEmail`, action renamed `sendInviteEmailAction`. Added
  `lib/format.ts` (`formatEventDate`, UTC-safe) for the dashboard cards.
- **Schema migration** (additive, idempotent, already applied to the dev
  project and re-run safe): `email_sends` gained `host_id`/`event_id`/
  `error` columns; `events` gained `status` (defaults `'published'` — no
  existing event goes dark) and `rsvp_deadline`, both Phase 4 prep.
- **Deferred to Phase 1** (per `docs/07`, not a Phase 0 item): the shared
  `EventDetailsForm` + live-preview theme picker — `events/new` and
  `settings` still have their own field markup for now, since that
  consolidation is bundled with the Phase 1 re-skin in the phase plan.
- **Not folded in**: `LockBodyScroll` stays a small client component
  rather than a CSS-only fix — doing it via `<body>` class would require
  restructuring the root layout for a route-group-conditional class, not
  worth the churn for a cosmetic edge case.

**Verified**: `npm run build` passes; grep proofs clean (no `select("*")`,
no direct Supabase table access, no `EventRecord`/`PageSchema`/
`FormSchema` casts outside `lib/data/`); live smoke via a scripted browser
session — signup → session persists across navigation → create event →
guests/design/settings tabs all load → dashboard lists the new event;
static route checks (`/`, `/login`, `/signup` 200, unauthenticated
`/dashboard` redirects, unknown `/e/[slug]` 404s) all correct. One bug
found and fixed during this verification: `export type { X }` re-exported
from a `"use server"` actions file breaks Turbopack's server-action
transform (`X is not defined` at runtime) — fixed by having consumers
import the type directly from its source module instead of re-exporting
it through the actions file.

## Status: Phase 1 (first slice) — Studio design system (2026-07-30)

Per `docs/07-build-phases.md` Phase 1. Note: the palette/font tokens,
brand mark/favicon, and split-screen auth pages were already done ahead of
schedule in the rebrand commit — this slice covers the remaining Phase 1
items that were still outstanding:

- **New `ui/` primitives** (`docs/04-design-system.md`): `toast.tsx`
  (`ToastProvider`/`useToast`, bottom-center, 4s auto-dismiss — replaces
  ad-hoc inline "Saved"/error text), `dropdown-menu.tsx` (dependency-free,
  closes on outside-click/Escape), `tooltip.tsx`, `skeleton.tsx`.
- **Button `outline` variant dropped** — every usage migrated to
  `secondary` (one way to do each thing, per doc04).
- **Dashboard list re-skin** (`docs/05`): swatch-strip cards (theme
  accent→accentDark gradient), whole-card click-through to the workspace,
  overflow `DropdownMenu` → confirm `Modal` → toast for delete (replaces
  `DeleteEventButton`/`ConfirmIconButton` inline-confirm on this page —
  `delete-event-button.tsx` deleted). `EmptyState` title now renders in
  the display serif.
- **Account menu**: dashboard header's bare email + sign-out button →
  `AccountMenu` (`DropdownMenu` with Sign out).
- **Shared `EventDetailsForm`** (`components/event-details-form.tsx`,
  deferred from Phase 0 per plan): `events/new` and `settings` now share
  one `EventDetailsFields` component and one theme picker with live
  mini-preview cards (real theme colors + Fraunces sample text) instead of
  events/new's plain swatch-only picker and settings having no theme
  control at all (a pre-existing gap — settings previously couldn't change
  an event's theme). Settings' save/delete now use toast + a confirm
  Modal (matching the dashboard card's pattern) instead of inline
  "Saved."  text and a separate `ConfirmIconButton`.

**Not done in this slice** (remaining Phase 1 scope, next slice): guests
tab StatTile/Badge/send-state re-skin onto Toast, icon stroke-width audit
(currently a consistent 2px across all icons — doc04 specifies 1.5px;
left as-is, a cosmetic-only mismatch, not worth a blanket edit risk right
now), contrast-ratio script, full keyboard-path pass, 390px mobile pass
of every Studio screen.

**Verified**: `npm run build` + `npx eslint` clean on all new/changed
files; live-scripted browser session — signup → create event (theme
picker selection confirmed via the resulting swatch-strip color) →
dashboard shows the swatch-strip card → overflow menu → confirm modal →
delete → toast confirmation → Fraunces empty state, zero page errors
throughout.

## Status: Phase 1 (second slice) — guests tab, a11y, verified gate (2026-07-30)

Closes out the remaining Phase 1 items from the previous slice's "not done"
list, per `docs/07-build-phases.md`'s Phase 1 gate:

- **Guests tab re-skin**: `StatTile` numerals now render in the display
  serif (tabular figures) with small-caps captions, matching doc04's
  signature style. The per-invite mail icon's sent/error state and the
  bulk "Email all pending" result both moved off ad-hoc inline text/title
  attributes onto the new `Toast`/`Tooltip` primitives — a partial bulk
  send (`sent < total`) now shows as an error-styled toast instead of a
  neutral inline string.
- **Modal keyboard path**: `Modal` was missing Escape-to-close entirely —
  fixed (a real a11y gap, not just a style pass). `DropdownMenu` already
  had it from when it was built.
- **Contrast audit**: computed WCAG contrast ratios for every Studio token
  pair against their actual usage backgrounds. All body-text pairs pass
  AA (≥4.5:1) except `--muted-foreground`, which is correctly
  placeholder/disabled-only per its own doc comment, not body text.
  `--warning` measured 4.48:1 (just under AA) — darkened `#9A6B1F` →
  `#8F631A` (5.07:1) in both `globals.css` and doc04's token table; the
  token isn't consumed anywhere in code yet, so this was a definition fix
  with no visual regression.
- **Mobile 390px pass**: screenshotted signup, dashboard (empty + populated
  with the swatch-strip card), events/new, the guests tab, and settings —
  all render cleanly with no overflow, correct stacking, and the shared
  `EventDetailsForm`'s theme picker holding a readable 2-up grid.

**Remaining, deliberately not done**: full keyboard-tab-order audit beyond
Modal/Dropdown (visual focus-ring coverage looks consistent from the
existing Button/Input styles, but wasn't walked control-by-control), and
the icon stroke-width mismatch noted in the previous slice (2px vs doc04's
1.5px spec) — both low-risk, low-value enough to defer rather than touch
every file for a cosmetic pass. **Phase 1 is otherwise complete.**

**Verified**: `npm run build` + `npx eslint` clean; live mobile-viewport
smoke (zero page errors) across every screen listed above.

## Status: Phase 2 (first slice) — Stage theme system v2 (2026-07-30)

Per `docs/07-build-phases.md` Phase 2. This slice covers the theme/font
system and guest-page block polish; the builder's Style-panel
reorganization (Blocks/Style tabs, custom-code scope switch) is deferred
to a follow-up slice — the device-width preview toggle it also calls for
turned out to already exist in `page-builder.tsx` from earlier work, so
that item is already satisfied.

- **4 new theme presets** (`lib/themes.ts`): Garden Party, Ocean Air,
  Fiesta, Ink & Blush — `THEMES` grows from 4 to 8; `ThemeId` widened to
  match. No consumer needed a code change beyond the type — every
  `THEMES.map(...)` call site (landing page gallery, theme-demo hero,
  event-details theme picker) picks up all 8 automatically.
- **Font pairs** (`lib/theme-fonts.ts`, new): one `next/font/google`
  instance per font family (14 distinct families across the 8 themes,
  Inter shared by two), `resolveThemeFonts(themeId)` returns each theme's
  `{displayClassName, bodyClassName, displayVar, bodyVar}`. Applied via
  `--t-font-display`/`--t-font-body` CSS custom properties on the guest
  page root (`e/[slug]/page.tsx`) and the builder's live-preview pane
  (`page-builder.tsx`) — the two font classNames are present in the
  render tree purely to make Next emit that theme's stylesheet; the
  actual applied font comes from the CSS vars via inline `style`, so
  there's no ambiguity between the two mechanisms. Confirmed live: a
  Fiesta event's `<h1>` computes to Bricolage Grotesque, a Classic Gold
  event's to Cormorant Garamond — same page, same component, different
  theme.
- **Guest-page block polish**: hero title now fluid (`clamp()`) and set in
  the theme's display font instead of a fixed Studio-style size; countdown
  digits tabular + display font; RSVP confirmation heading in display
  font; venue map corner radius bumped to a more premium mask
  (`rounded-lg` → `rounded-2xl`). RSVP form inputs/buttons were already
  themed on `--t-*` tokens from earlier work, so no change needed there.
- **Footer line**: every guest page now ends with a discreet "Made with
  Ahvaan" line linking home, themed to the event's own colors (per
  docs/05's nav rule: guest pages carry no Studio chrome except this one
  line).

**Verified**: `npm run build` + `npx eslint` clean (one real lint fix — a
raw `<a href="/">` in the new footer swapped for `next/link`; the other
4 eslint errors reported are pre-existing `set-state-in-effect` findings
in files this session didn't touch the effect logic of, not new).
Live-scripted: created a Fiesta event and a Classic Gold event end-to-end
(signup → theme picker → settings → invite link → guest page), confirmed
each renders its own distinct font family with zero page errors, and that
a pre-existing theme id (Classic Gold) still renders correctly alongside
the new one (no regression for old events).

## Status: Phase 2 (second slice) — form-builder preview, unsaved-dot (2026-07-30)

Closes the remaining doc07 Phase 2 items that were still open after the
theme-system slice. The device-width preview toggle was already built in
an earlier session (confirmed present in `page-builder.tsx`, not new
work); the Style-panel Blocks/Style-tab reorganization was deliberately
**not** attempted — `page-builder.tsx` already exposes Theme (top-bar
picker), Page (Page settings modal), and Block (per-block edit modal) as
three clearly-scoped surfaces, which satisfies doc04's underlying intent
("three scopes") even though the presentation is per-scope modals rather
than one tabbed side panel. Reorganizing a working, intricate dnd-kit
editor into a different shell for a mostly-cosmetic reshuffle wasn't worth
the regression risk this late in the session; noted as a real follow-up,
not silently dropped.

- **Form-builder live preview** (`docs/05`): a new Edit/Preview
  `ToggleGroup` in the right pane. Preview mode renders the *actual*
  `RsvpForm` component guests see — not a lookalike — themed on the
  event's real colors/fonts, fed the live (unsaved) field list. Submitting
  from preview is harmless by construction: `eventId`/`inviteId` are both
  the literal string `"preview"`, so `submitRsvp`'s invite lookup finds
  nothing and returns its existing "invalid or expired" error state — no
  parallel preview-safety logic needed.
- **Editor unsaved-dot Save** (`docs/07`): the page builder's Save button
  now shows a small warning-colored dot when the in-memory schema differs
  from what was last persisted (compared via a JSON snapshot taken on
  load and refreshed after every successful save). First real usage of
  the `--warning` token added during Phase 1's contrast audit.
  **Bug caught during verification**: the initial snapshot didn't apply
  the same `customPage` default-object fallback the live state does, so
  the dot showed as "dirty" on a freshly-loaded, untouched page for any
  event whose `page_schema` predates the custom-page feature (no
  `customPage` key at all). Fixed by computing the fallback once and
  reusing it for both the state initializer and the snapshot.

**Verified**: `npm run build` clean; `npx eslint` shows only the
pre-existing `mounted`-effect finding (unchanged, not touched this
slice). Live-scripted: form-builder Edit/Preview toggle renders correctly
(screenshots taken); dirty-dot absent on fresh load, appears after adding
a block, clears after Save — confirming the fix, not just the feature.

**Phase 2 is now complete** per `docs/07-build-phases.md`'s item list,
with the one explicit exception (Style-panel tab reorganization) called
out above.

## Status: Page builder overhaul — nesting, DnD reliability, embeds (2026-07-30)

A large, host-feedback-driven pass fixing the page builder's layout/nesting
system, which turned out to have several real, confirmed bugs beneath the
"finicky" complaint — not just a UX polish pass.

**Drag-and-drop reliability** (`page-builder.tsx`, `editable-canvas.tsx`):
- Moving an *existing* block onto an empty container (or the newly-added
  always-present end-of-list drop zone) was completely unhandled — only
  brand-new palette blocks had this case covered. Fixed, and extended to
  containers-into-containers too.
- Added a persistent `EndOfListDropZone` to every list (top-level and each
  container's children) — previously only a *totally* empty list had any
  drop target past the last item, so dropping "at the end" or dragging a
  block out of a container into open space silently no-opped.
- Added click-based, drag-free alternatives that don't depend on hitting a
  precise drop target: a "Move out" one-click action and a general
  "Move to…" menu (any container or the top level) on every block's canvas
  toolbar, built on the same `moveBlock` primitive as the existing
  "Position" dropdown in each block's edit modal.

**Nested containers actually work now** (`page-builder.tsx`,
`json-schema-editor.tsx`, `lib/schemas/page-schema.ts` already supported
depth ≥1 — only the *app* didn't):
- Every tree helper (`getBlockList`, `setBlockList`, `listContaining`,
  `blockTypeAndLabelForId`) only ever searched one level deep. A container
  nested inside another container (buildable via the JSON code editor,
  which the schema always allowed) was invisible to drag/drop and most
  lookups. Rewritten to walk the tree recursively, with cycle-safe
  container-option filtering (`collectContainerIds`) so a container can
  never be moved into itself or its own descendant.
- The JSON editor's own separate validator explicitly *rejected* nested
  containers with a hardcoded one-level check — relaxed to match the real
  depth cap (8), and its duplicate-id check was fixed to walk the whole
  tree instead of two levels.
- JSON editor rebuilt as one collapsible section per top-level block (was
  a single flat textarea for the whole page) — each section applies and
  validates independently.

**Block naming**: blocks can now be given a host-chosen name (shown in the
canvas chip and every "Move to…" menu, indented by nesting depth) instead
of only the generic type label — makes multiple same-type containers
(e.g. "Left Column"/"Right Column") distinguishable.

**Canvas toolbar collisions** (the actual root cause behind "the edit/drag
menu is getting buried"): CSS `:hover`/`group-hover` bubbles to *every*
DOM ancestor, so hovering a nested block also counted as hovering every
container wrapping it — both toolbars appeared simultaneously, overlapping
(confirmed via a host screenshot). Replaced with JS-tracked "deepest
hovered block" state (`onMouseOver` + `stopPropagation()`, innermost
element wins) so exactly one toolbar shows at a time. Also: containers no
longer render a full-cover "click to edit" overlay over their own body —
that overlay was sitting on top of every nested child's own interactive
controls, silently eating clicks meant for them. A container's own
controls are now permanently visible instead of hover-gated (a container
padded/gapped to 0px has no exposed background left to hover at all once
it holds children — otherwise its own edit/move/delete became
unreachable). Toolbar z-index now scales with nesting depth as a second
layer of defense. Editor-only minimum spacing (4px) was also added around
every nested child regardless of the container's own configured gap/
padding, which still applies exactly as set on the real guest page.

**Simplified Layout panel** (`components/builder/layout-controls-ui.tsx`):
Width/Align stay always visible; Min height, Text color, and Custom CSS
moved behind a single "Advanced options" disclosure. Fixed a genuinely
dead control: the Width preset had zero visible effect inside a grid
container (grid columns size the block instead) or once a Row-share value
was set — it's now hidden with a one-line explanation instead of looking
interactive and doing nothing. The two "Custom CSS" fields that appeared
identically labeled inside a Container block's edit modal (one for its
outer position, one for its own inside styling) are now clearly
disambiguated, and the generic block-level CSS presets were changed from
atomic single-property snippets (often invisible alone, e.g. border-radius
with no background) to bundled, guaranteed-visible presets.

**Component embedding in custom code** (new): `lib/blocks/shortcodes.ts` —
writing `{{rsvp_form}}` or `{{venue_map}}` anywhere in a custom-HTML block
or the whole-page custom mode gets it replaced, server-side, with real
functional markup. The venue map is pure static HTML (a Maps embed + a
link). The RSVP form needed a new public endpoint (`POST /api/rsvp`,
`src/app/api/rsvp/route.ts`) since a sandboxed opaque-origin iframe can't
invoke a Next.js Server Action (no same-origin fetch with the internal
action-id header) — a plain HTML `<form method="post">` has no such
restriction. Both the server action and the new route now share one
validated implementation (`lib/rsvp-submit.ts`) instead of duplicating
logic. Fixed a real bug surfaced while testing this: a malformed
(non-UUID) invite/event id threw an uncaught Postgres error (500) instead
of the intended graceful "invalid or expired" message — now caught.

**RSVP form finer control**: the "By invitation only" note and the
post-submit confirmation (heading text, whether the venue map shows) were
previously hardcoded with zero host control — both are now block config
fields (`noInviteHeading`/`noInviteMessage`,
`confirmedYesHeading`/`confirmedNoHeading`/`showVenueOnConfirmation`).

**Verified live** throughout via scripted browser sessions: drag into an
empty container, drag into a non-empty one, click-based move-out and
move-to (including container-to-container), the exact nested-container
JSON the host provided (applied via the code editor, both inner
containers correctly droppable and named), collapse/expand, only one
toolbar visible when hovering a nested block (confirmed via computed
opacity, matching the reported screenshot scenario now fixed), a
container's own edit action reachable without hovering empty space, the
`{{rsvp_form}}`/`{{venue_map}}` shortcodes rendering inside the sandboxed
iframe, `/api/rsvp` both succeeding and gracefully rejecting bad input,
and a full signup → event → invite → guest RSVP → dashboard regression
pass with zero page errors throughout.

Build + `npx eslint src` clean across every change in this pass (only the
4 pre-existing `set-state-in-effect` findings remain, unchanged from
before this session).

## Status: Phase 4 — feature completion (2026-07-30)

All five doc-01 "New in v1" items, each its own commit:

- **Draft/published status**: new events start `draft` (existing events
  stayed `published` via the column default from Phase 0's migration).
  Public `/e/[slug]` 404s a draft for everyone except its own host, and
  only via an explicit `?preview=1` link (shows a small draft-preview
  banner) — never just by a signed-in host guessing another host's slug.
  Settings gets a Visibility card (Publish/Unpublish); dashboard card and
  event header both show a Draft/Published badge; the header's public
  link becomes "Preview page" (with the param) while draft.
- **RSVP deadline**: optional datetime field in Settings. Past it, the
  rsvp-form block shows a themed closed note (heading/message
  configurable, same pattern as its other states) instead of the form —
  a guest who already responded still sees their confirmation, just
  can't reopen/edit it. Enforced server-side in `submitRsvpFromFormData`,
  not just hidden; host-side manual edits from the Guests tab are
  unaffected.
- **Image upload**: new `event-images` public-read Supabase Storage
  bucket (service-role write only, 5MB/jpeg-png-webp-gif limits enforced
  both at the DB level and in app code), provisioned by the same
  idempotent `schema-saas.sql` hosts already run. A shared
  `ImageUploadField` (upload button + URL-paste fallback) replaced the
  plain URL inputs on the hero cover image and the Image block — the
  hero cover image previously had no editable UI at all despite the
  render path already supporting it, now wired through the same
  debounced event-fields save the rest of the Hero editor uses.
- **CSV export**: "Export CSV" button in the Guests tab header, built
  client-side from data the page already fetched. One row per invite
  (pending or responded), Name/Email/Status/Responded-at, then one
  column per current form field by label. UTF-8 BOM + RFC 4180 quoting
  for Excel/Numbers compatibility with non-ASCII names and embedded
  commas/quotes.
- **Password reset**: `/forgot-password` (identical response whether or
  not the email has an account) → Supabase's PKCE reset-email flow →
  `/reset-password`, where a small browser-only Supabase client exchanges
  the emailed `?code=` for a session (the one step that has to run
  client-side) before a server action updates the password and redirects
  into the dashboard.

Also fixed two RSVP-form edge cases found while starting this pass, each
its own commit: a host emptying the form to zero fields silently reverted
to the default 3-field form on the live guest page while the builder's own
preview showed it empty (now honored as a real, intentional shape);
removing the name-role field blanked every future guest's name to the
literal string "Guest" instead of falling back to the invite's own name
(now it does); and there was no way to re-add a built-in
name/attending/plus-ones question once deleted (new "+ Name" / "+
Attending?" / "+ Plus ones" buttons appear for whichever built-in roles
are currently missing).

**Verified**: `npm run build` clean after every commit; `npx eslint` shows
only the same pre-existing `set-state-in-effect` findings as before this
phase (one new occurrence in `reset-password/page.tsx` was restructured,
not suppressed, to avoid adding a fifth). Not verified: a live Supabase
email round-trip for the password-reset flow (needs `RESEND`-equivalent
inbox access this session doesn't have) — the code path was traced
against Supabase's documented PKCE reset flow instead.

Phase 4 gate items still outstanding, deliberately deferred to Phase 5/6:
image resizing/`sizes` (doc 08), and the live regression pass a real
browser session would give (doc 08's checklist, doc 07 Phase 6).

## Status: Phase 5 — production hardening, code-addressable items (2026-07-30)

Every doc-08 item that's a real code change, each its own commit. Explicitly
**not** attempted: anything requiring a live browser, a deployed environment,
or third-party dashboard access (Lighthouse/axe runs, a real Resend domain
verification + received email, Vercel/Supabase production settings, PITR,
cross-browser passes) — those are Phase 6 / doc08's "Deployment & operations"
section, listed as open below, not silently skipped.

**Security**:
- RLS policies (defense-in-depth) on `events`/`invites`/`rsvps`/
  `email_sends`/`custom_components`: authenticated scoped to
  `host_id = auth.uid()`, anon gets nothing. Changes nothing about current
  behavior (app never queries with anon/authenticated keys) — a second,
  independent layer in `schema-saas.sql`, not yet run against the live
  project from here.
- Per-invite RSVP submit throttle (≥2s between writes, documented
  per-instance caveat) alongside the size/length limits that already existed.
- Sandbox re-audit: `allow-same-origin` confirmed absent everywhere (no code
  change needed); `parseInlineStyle` previously had **no** value filtering at
  all — now rejects `url(...)`/`expression(...)` values outright.
- Security headers via `next.config.ts`: CSP, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy`, `X-Content-Type-Options`. **Bug found and fixed same
  session**: the first version had no `unsafe-eval` in dev, which broke
  Next's dev server outright ("eval() is not supported") — now scoped to
  dev only via `NODE_ENV`, production CSP unchanged.

**Email**: invite/reminder templates re-styled to the real paper/ink/accent
hex values (docs/04) instead of generic gray/black, Georgia/serif heading
fallback in place of Fraunces (email clients won't load it), and a
plain-text alternative added to both sends (previously html-only).
`email_sends` audit rows were already populated with host_id/event_id/error
on both success/failure paths — verified, no change needed.

**Error/empty surfaces**: root `error.tsx` (apologetic, `reset()`-backed
"Try again") and a marketing-voice root `not-found.tsx`, plus the two
voiced versions doc05 asked for — Studio (`/dashboard`, muted "Back to
events") and Stage (`/e/[slug]`, neutral paper "This invitation isn't
available"). `loading.tsx` skeletons for the dashboard event-card grid and
the per-event workspace tabs, using the `Skeleton` primitive that's existed
since Phase 1 but was never actually wired to a route. Audited server
actions for silent catches/raw Postgres messages — existing code was
already solid, no changes needed.

**SEO**: `robots.ts` (allow `/`, disallow `/dashboard` + `/e/` — guest pages
are a privacy choice, not just SEO), `sitemap.ts` (marketing page only),
`/e/[slug]` `generateMetadata` (real title/subtitle for a published event,
generic for a draft, always `noindex`, never invite/guest data).

**Accessibility**: computed real WCAG contrast ratios (fg/bg, accentDark/bg,
accentDark/surface) for all 8 themes instead of eyeballing — accentDark is
real guest-facing text (RSVP labels/headings). Found and fixed 3 real AA
failures: Playful Pastel, Garden Party, Fiesta — darkened each theme's
`accentDark` while keeping its hue. Added a global
`prefers-reduced-motion` CSS floor (near-zero animation/transition
durations, forced instant scroll) covering Modal/Toast/Dropdown/builder-drag
in one place rather than auditing every animated component; the marketing
`Reveal` component already had its own `matchMedia` check. **Bug caught
mid-session**: the reduced-motion CSS comment contained `animate-*/
transition-*`, whose `*/` closed the comment early and broke the build —
fixed immediately, same commit.

**Legal**: real `/privacy` and `/terms` pages grounded in what this app
actually does (no ad tech/analytics/data-sale anywhere in the codebase,
free with no billing) — not generic boilerplate — linked from the marketing
footer. Flagged to the host: still needs real legal review before launch.

**Verified**: `npm run build` + `npx eslint src` clean after every commit
(only the same pre-existing `set-state-in-effect` findings remain,
unchanged). Security headers spot-checked server-side (production
build + start, headers present, home page still serves correctly) — not
verified in an actual browser.

**Explicitly open** (doc08 items needing live/infra access this session
doesn't have — carry into Phase 6 or a deploy pass):
- Resend domain verification + a real sent/received email.
- Vercel (or equivalent) production env, custom domain/HTTPS, log drains.
- Supabase: confirm PITR/backups on, indexes present in prod, run the new
  RLS-policy SQL and the `event-images` bucket SQL against the live project.
- Lighthouse/axe runs (perf ≥95, a11y ≥95, LCP/CLS budgets), keyboard-only
  walkthrough, cross-browser pass.
- Image resizing/`sizes` for uploaded images (doc08 perf item, not attempted).
- Minor: Playful Pastel/Ink & Blush's `accent` (border/tint only, never
  text) sits just under the 3:1 non-text-UI threshold — left alone rather
  than fighting the intentionally soft palette; noted, not fixed.

## Status: Generic multi-form system + RSVP Actions tab (2026-08-02)

User-directed scope addition beyond the original docs/01 feature matrix
("Form builder with role-tagged fields" was the only form-building item
listed) — explicitly requested and confirmed via a scope-fork question
before implementation: RSVP's guest-tracking data model (`invites`/`rsvps`,
attending/declined stats, invite-link linkage) stays completely separate
and untouched; a new, independent generic form system sits alongside it for
any other host-defined form (feedback, song requests, T-shirt sizes, ...).
Both share one navigation *pattern* (Fields/Data/Actions sub-tabs) via
shared components, not a shared data model.

**Field-type engine** (`src/lib/forms/`): 11 kinds (text, textarea, email,
phone, number, date, select, radio, checkbox, checkbox_group, address —
address is a compound value, validated as one unit). Validation is a real
class hierarchy (`FieldValidator` base, template-method `validate()`, one
concrete subclass per kind in `validators/`); UI is composition + a
registry (`FIELD_TYPE_REGISTRY`, mirrors the existing block-registry
pattern) — each kind's Edit/Input pair looked up by kind, not switched on.
Schema structurally validated per-kind via zod
(`src/lib/schemas/custom-form-schema.ts`), unlike page-schema's
deliberately-loose block config, since a form's schema directly gates
anonymous guest input.

**New tables**: `forms` (host_id, event_id, name unique per event, schema,
actions jsonb), `form_submissions` (host_id/event_id denormalized per the
existing tenancy convention) — `supabase/schema-saas.sql`, run manually
against the live project (not from this session).

**Dashboard**: new "Forms" top-level tab (list/create per event, each with
Fields/Data/Actions sub-tabs, CSV export). "Guests" gained the same
Fields/Actions sub-tabs (Data = the existing guest list unchanged) —
today's `.../form` route now redirects to `.../fields`; the old
"RSVP form" top-level tab is gone.

**Page builder**: new "form" block (Guest interaction category) embeds any
named form by id; `PageRenderContext` gained `customForms`, populated the
same once-per-render way as the existing `customComponents` map.

**Post-submit Actions** (`src/lib/schemas/post-submit-actions.ts`): message
/ redirect / custom HTML, shared by RSVP (`events.rsvp_actions`, new
Guests → Actions tab) and every custom form (`forms.actions`) through one
`<ActionsEditor>`. RSVP's previously-hardcoded confirmation fields
(`confirmedYesHeading`/`showVenueOnConfirmation`/`confirmationHtml`/...)
moved out of the page-builder block into this event-level column — a
read-time fallback (`synthesizeLegacyRsvpAction`) reads the block's
now-untyped legacy fields when `rsvp_actions` is null, so every existing
event's public page and its Actions-tab defaults are byte-identical to
before, with no backfill migration step.

**Verified live** (persistent Test Event): all three action kinds
(message/redirect/custom_html) end-to-end for both RSVP and a real custom
form with one of each field kind including the compound address field;
server-side per-field validation confirmed independent of client-side
(bypassed native `type=email` checking); Data-tab schema evolution (a
column added after an earlier submission renders blank, doesn't break);
CSV export. `npm run build` clean throughout.

## Status: Public host profile + legal disclaimer (2026-08-02)

User-directed addition, outside doc 07's original phase plan (see docs/01's
matching dated feature-matrix entry). Also fixed, same session: broken
auth flows (missing `/auth/callback` PKCE handler — the root cause of a
dead password-reset link — plus Google OAuth sign-in and auth-aware
marketing nav) and two Google OAuth-verification branding rejections
(homepage purpose copy, `<title>`/og/twitter metadata trimmed to the bare
"ahvaan" so it literally matches the OAuth consent screen's App name).

**New table**: `host_profiles` (`host_id` primary key referencing
`auth.users(id)`, `display_name`, `bio`, `avatar_url`, `updated_at`) —
`supabase/schema-saas.sql`, run manually against the live project (not from
this session). RLS mirrors every other table's `host_id = auth.uid()`
policy. New public-read `host-avatars` Storage bucket, same model as
`event-images`.

**Data layer** (`src/lib/data/host-profile.ts`): `getHostProfile` (host-
scoped, dashboard), `getHostProfilePublic` (cached like
`getEventBySlugPublic`, narrow columns only), two independent partial-
update functions (`updateHostProfileFields`, `setHostAvatarUrl`) rather
than one combined upsert — the avatar upload/clear flow doesn't carry the
name/bio fields, and a combined upsert would have silently blanked
whatever the host had already saved on every photo change.

**Dashboard**: new `/dashboard/profile` page (Account menu → "Edit
profile", the menu's first entry above Sign out) — display name, bio
(500-char cap), and a circular avatar uploader (`AvatarUploadField`, a
generalization of `ImageUploadField` without the "paste a URL" fallback,
new `uploadHostAvatar` in `src/lib/data/storage.ts`).

**Guest pages** (`src/app/events/[slug]/page.tsx`): `PublicHostCard`
renders above the existing "Made with ahvaan" link — host name/bio/avatar
only if at least one is set, but the disclaimer sentence ("this page and
any data collected here are managed solely by its host, not ahvaan")
always renders once an event is published, independent of whether the
host ever visited Profile. The custom-page branch (raw host HTML/CSS/JS in
a sandboxed iframe) gets the same treatment folded into its existing
fixed-position "Made with ahvaan" pill rather than a second floating
element.

`npm run build` clean throughout.

## Status: Storage cleanup, account deletion, client-side image compression (2026-08-02)

Follow-up to the host-profile entry above, same session, user-directed.

**Storage cleanup** (`src/lib/data/storage.ts`): `deleteEventImages(hostId,
eventId)` wipes an event's whole `${hostId}/${eventId}/` folder in
`event-images` — covers hero cover + every Image/carousel block's upload
without parsing `page_schema`, since they all share that one folder.
Wired into `events.ts`'s `deleteEvent` (best-effort — a storage failure
doesn't block the already-completed DB delete). `deleteHostAvatarByUrl`
removes one specific avatar file (parsed back out of its own public URL);
wired into `uploadAvatar`/`clearAvatar` (dashboard/profile/actions.ts) so
replacing or removing a photo doesn't leave the old file orphaned.
`deleteAllHostImages(hostId, eventIds)` wipes every image across every
bucket for full account deletion below.

**Account deletion**: new "Danger zone" on `/dashboard/profile`
(`deleteAccount` action) — cleans up all Storage files first (while
eventIds are still known), then `supabase.auth.admin.deleteUser(host.id)`,
which cascades every `host_id references auth.users(id) on delete cascade`
table (events, invites, rsvps, email_sends, custom_components, forms,
form_submissions, host_profiles) automatically. No `redirect()` inside the
action (same reasoning as `deleteEvent`'s existing comment); the client
does a full `window.location.href = "/"` after success instead of
`router.push`, so no stale client state for the now-deleted account survives.

**Client-side image compression** (`src/lib/compress-image.ts`): an
oversized upload (event image or avatar) is resized/re-encoded to fit the
5MB limit via canvas (scale to a 2400px max dimension, then step JPEG
quality down, then one further dimension cut if still too big) instead of
being rejected outright — GIFs are left untouched (canvas only captures
one frame, would kill animation). Wired into both `ImageUploadField` and
`AvatarUploadField`; the old "must be 5MB or smaller" rejection is gone
from both, server-side validation stays as a backstop.

**Public host card sizing**: shrunk to a single small inline
avatar+name line plus one short muted disclaimer sentence (no bio shown
publicly) — user feedback that the first pass read as too prominent for
what's meant to be a discreet legal footnote, not a competing profile card.

`npm run build` clean throughout.

## Status: Home page redesign — Studio tour, fuller feature coverage (2026-08-02)

User-directed marketing redesign, same session. Goal: a more premium,
feature-complete home page that drives signups by proving depth, not just
describing it.

**`src/components/marketing/studio-tour.tsx`** (new): a client component
reproducing the real Studio dashboard chrome — the actual `SideNav` row
treatment, `StatTile`, `Badge`, `ToggleGroup` components plus a fake
browser-chrome bar — with four clickable tabs matching the real IA
(Guests · Invite page · Forms · Settings), each swapping in a static,
hardcoded pane. No host data, no live queries; same "prove it with real
components" spirit as the existing `ThemeDemo`. Replaces an earlier pass
at a generic icon-and-prose feature grid, cut after user feedback that it
read as boring/generic marketing filler rather than something that
demonstrates the product.

**`src/app/page.tsx`**: new "Everything included" section (between "How it
works" and the deep-dive rows) pairs `StudioTour` with a chip row for the
handful of real, shipped features too situational for a tab — per-device
layout control, sandboxed custom code, draft/publish, RSVP deadline, CSV
export, public host profile, delivery-logged reminders. Deep-dive rows
each gained a category eyebrow (Page builder / RSVP form / Communication)
for hierarchy; the three vignettes and theme-gallery cards gained a
subtle hover lift for a more fluid feel. FAQ expanded from 5 to 7 items to
cover CSV export and custom code, both real features with no other home
above the fold.

`docs/06-home-page.md` updated in the same session to document the new
§5 Studio tour section and the FAQ count change.

`npm run build` clean throughout. Not yet verified live in a browser
(no Playwright/chromium-cli available in this environment) — verified via
clean production build and a curl of the rendered HTML for the new
section's markup; recommend a manual look before shipping.

## Status: StudioTour rebuilt to match the real dashboard chrome (2026-08-02)

Follow-up, same session — user feedback that the first `StudioTour` pass
(a fake browser-chrome bar + icon-labeled sidebar) didn't actually look
like the app.

**`src/components/marketing/studio-tour.tsx`**: rebuilt to mirror
`event-layout-shell.tsx` directly instead of inventing new chrome. The
header replicates its exact Zone A (breadcrumb caption, Fraunces event
title, status `Badge`, "View public page" link); the sidebar drops the
icons the real desktop `SideNav` doesn't have and replicates its row
treatment, adding a sliding `bg-accent-soft` indicator (`translateY`,
200ms `cubic-bezier(.2,.8,.2,1)`, docs/04's motion curve) instead of a
per-row static rail. The "Invite page" pane now has a two-column
components-list-plus-canvas shape echoing the real page builder
(`component-palette.tsx`'s "Components" caption header) with a real
`ToggleGroup` for the Desktop/Mobile device switch, tying the per-device
layout story directly to the visual. Tab content crossfades in via a new
`animate-tour-pane-in` utility (`globals.css`, transform/opacity-only
keyframes, respects the existing reduced-motion floor) instead of
snapping.

`npm run build` and `npm run lint` both clean (two `react/no-unescaped-
entities` errors from the prior pass fixed in `src/app/page.tsx` along
the way). Still not verified in an actual browser — no Playwright/
chromium-cli in this environment; verified via clean build/lint plus a
curl of the rendered HTML.

## Status: Full-repo production-readiness audit + fixes (2026-08-02)

User-directed, same session as the previous entries. First produced a
structured production-readiness audit (five parallel research passes
covering app router/caching, data layer/tenancy/security,
sandbox/blocks/forms security, React components/design system, and
config/deps/schema/docs), then implemented every finding — critical
through low priority, plus two issues the user reported live
(iOS input-zoom, and a "delete form" icon floating disconnected from its
title on mobile).

**Critical fixes**:
- `getEventBySlugPublicCached`/`getHostProfilePublicCached` used
  `unstable_cache` with a static empty `tags: []` — `revalidateTag` at
  every write site matched nothing, so a host's edits could silently fail
  to reach the live guest page. Replaced with a manually-keyed cache
  (`src/lib/cache/keyed-cache.ts`) whose `invalidate(key)` actually removes
  the changed entry. Covered by a unit test.
- Guest email-verification (OTP) sends had no rate limit independent of
  the caller-supplied email — an attacker could email-bomb any address.
  Added a cross-instance, DB-backed sliding-window limiter
  (`src/lib/data/rate-limit.ts`, new `rate_limit_hits` table in
  `schema-saas.sql`), also applied to RSVP/form submission as a proper
  fix for the pre-existing in-memory-only limiter's multi-instance gap.

**High-priority fixes**: parallelized the public event page's independent
data lookups (host profile, custom components/forms) instead of awaiting
them serially; added the missing `--radius-*`/`--shadow-*` design tokens
to `globals.css` and wired them into Card/Modal/Toast/DropdownMenu/
StatTile/EmptyState/StudioTour (the components docs-04 names explicitly);
Modal gained a real focus trap + focus-restore-on-close; `Field`/
`PublicField` now auto-wire `htmlFor`/`id` via `useId()` (labels were
never actually associated with their inputs); fixed a Toast bug where
adding one toast reset every other toast's auto-dismiss timer; added a
pre-parse `Content-Length` cap to the two public API routes; added a
minimal test suite (vitest, 23 tests over the schema validator, sandbox
HTML escaping, safe-URL scheme check, rate limiter, and cache) plus a
GitHub Actions CI workflow running lint/test/build; rewrote `README.md`
from unedited `create-next-app` boilerplate into real setup instructions.

**Medium fixes**: added scoped `error.tsx` under the event workspace and
the guest page (previously only a root one existed); moved
`Content-Security-Policy` from a static `next.config.ts` header
(`script-src 'self' 'unsafe-inline'`) to a real per-request nonce +
`'strict-dynamic'` generated in `src/proxy.ts`, which now runs on
effectively every route instead of just four auth-related paths — the
sandboxed custom-code iframe's inline `<script>` is nonce'd to match,
since a `srcdoc` iframe inherits its creator document's CSP; fixed
`listRespondedInviteIds` to take/filter `hostId` like every sibling in
`rsvps.ts`; fixed the one remaining `select("*")` in the data layer
(`host-profile.ts`); added roving-tabindex/arrow-key navigation to
`ToggleGroup`; added `aria-live`/`role="alert"` to form/action error text
across the app; fixed several stale `/e/[slug]` route-name references
(actual route is `/events/[slug]`) in code comments and `docs/`; batched
`sendReminderEmails`'s per-invite audit-log inserts into one multi-row
insert and parallelized the submission-mode email-field backfill.

**Low-priority fixes**: `ConfirmIconButton` rebuilt on the shared
`IconButton` primitive (was a hand-rolled `<button>` missing the standard
focus ring); extracted `useClipboardCopy`/`useNativeShare`/
`useTransientFlag` hooks to de-duplicate three previously-independent
copies of the same "copy/share/transient-success-icon" logic
(`src/hooks/`); added `Tooltip` to every remaining icon-only button
missing one; removed the dead `CardFooter` export; removed an unnecessary
`"use client"` from `bottom-nav.tsx`; fixed `manifest.ts`'s `start_url`
(was the auth-gated `/dashboard`); documented `public/sw.js` in doc 08
(previously shipped with zero doc coverage); fixed a silently-swallowed
error in `email-verification.ts`'s cleanup delete; hardened
`buildSandboxSrcDoc` to escape a literal `</script>`/`</style>` inside
host-authored js/css; added scheme validation (`safeImageSrc`) to
image/carousel block URLs.

**User-reported bugs fixed live, mid-session**: inputs zoomed the whole
page on focus on mobile (iOS Safari auto-zooms any input under 16px font
— every field control now uses `text-base sm:text-sm`, real size
unchanged at `sm`+); the "delete form" icon button on
`dashboard/events/[eventId]/forms/[formId]` sat disconnected from the
"Songs" title, floating in empty space on mobile — root cause was
`PageHeader`'s `actions` slot stretching a lone action to full width via
`*:flex-1` (correct for the Guests page's two-button CTA pair, wrong for
a single icon-only action, which just centers inside the stretched
space). Added a `PageHeader` `inlineActions` prop that keeps `actions` on
the same row as the title at every width instead of stacking below it,
used by `form-header.tsx`.

Also found and fixed one real bug while writing the schema-validator
test: `parsePageSchema`'s `MAX_CONTAINER_DEPTH` schema forced `children`
to `z.undefined()` (not `.optional()`) past the cap — this rejected any
ordinary leaf block (a block with no `children` key at all, which is
every non-container block type) the moment its nesting depth reached the
cap, not just genuinely over-deep containers. Fixed to
`z.undefined().optional()`.

Explicitly out of scope this session (documented, not silently skipped):
the broader raw-Tailwind-text-size/spacing sweep across ~90 call sites in
`components/{ui,builder,guest-dashboard,marketing}` (doc-04's 6-step type
scale exists and is now used by the specific components audited, but a
blind mass find/replace across dozens of files risks visual regressions
with no way to verify them live in this environment); live email/
Lighthouse/axe/production-environment verification (all require live
account/browser access this environment doesn't have — see doc 08's
updated checklist for exactly what's still unchecked and why).

`npm run build`, `npm run lint`, and `npm test` all clean throughout.
Layout fix for the mobile header verified structurally (build + careful
CSS reasoning) but not in an actual browser — no test credentials
available to log in and screenshot the live page in this environment.

## Status: Public /docs site — guides, developer reference, live examples (2026-08-02)

User-directed, outside `01-product-definition.md`'s original v1 feature
matrix (same category as the generic multi-form system and public host
profile) — a new public, no-auth surface (Studio / Stage / **Docs**), scoped
first in `docs/10-docs-site.md` before implementation.

**What shipped**: `/docs` — 12 Guides pages (getting started, PWA install,
events, one page per page-builder block type (12), layout controls, styling,
custom code/sandboxing, themes, RSVP form, custom forms, guests, email,
profile, images, account/security) and 9 Reference pages for
developers/contributors (architecture, the `host_id` invariant, JSONB
validation, adding a block type, the sandboxing model, rate limiting, design
tokens, testing/CI, caching) — every fact cross-checked against current
`src/` (not written from memory), each Reference page citing real file:line
locations. A persistent multi-level `DocsNav` (deliberately not `SideNav` —
that component's own doc comment is explicit it never nests a second level;
Docs is a different surface with a different job). Shared content
primitives in `components/docs/docs-ui.tsx` (`DocsArticle`, `Callout`,
`Screenshot`, `CodeBlock`, `FileRef`, `DocsPrevNext`).

**Live examples** (`/docs/examples`): three real, published, anonymous-mode
events under a generic `docs-demo@example.com` account (never the real host's
email/name) — Sunlit Garden Brunch (Garden Party theme, side-by-side
container layout, elegant-timeline schedule, embedded custom "Song Requests"
form), Midnight Gala (Midnight Elegant theme, card-style schedule), Playful
Backyard Bash (Playful Pastel theme, 3-column grid, embedded "Guestbook"
form) — demonstrating multiple block types, layouts, themes, and the generic
forms system on genuinely working pages anyone can open and try.

**Screenshots**: `scripts/seed-docs-demo-user.mjs` (creates/confirms the demo
host via the Supabase Admin API — real signup requires email confirmation
this environment can't complete), `scripts/docs-screenshots.mjs` and
`scripts/docs-block-screenshots.mjs` (Playwright, captures every dashboard
surface and a clean "Edit block" modal — settings next to a live Preview
pane — for all 12 block types) into `public/docs/screenshots/`.

**SEO**: unique title + meta description on all 38 pages; `sitemap.ts`
extended to include every docs page (derived from the same nav-data list
`DocsNav` renders, so it can't drift); Open Graph/Twitter images — 22 pages
use their own real screenshot, the ~15 screenshot-less conceptual pages get
a per-page dynamically-generated branded card (`src/app/docs/og/route.tsx`,
`next/og` `ImageResponse`) instead of one repeated image; every docs page
emits `BreadcrumbList` + `Article`/`TechArticle` JSON-LD (baked into
`DocsArticle` itself, keyed off the same `current` href already passed to
`DocsPrevNext`, so no page hand-authors structured data). Marketing home
page gained `Organization`/`WebSite` JSON-LD (the one gap found there).
"Docs" linked from `PublicFooter` (every public page) and the dashboard
`AccountMenu`.

**Bug found and fixed live, unrelated to docs**: `component-palette.tsx`'s
`GuestInteractionCategory` — confirmed via a live Playwright pass — was a
pre-existing Turbopack HMR-staleness scare, not a real bug (full dev-server
restart cleared it); the actual bug found was in this session's own seed
scripts (a URL regex matching `/dashboard/events/new` before its redirect
completed), not app code.

`npm run build`, `npm run lint`, and `npm test` all clean throughout (57
static pages including the full docs tree). Verified live in a real browser
via Playwright throughout (not just build-checked) — screenshots, OG image
output, JSON-LD script tags, and the three live example pages were all
fetched and visually inspected during the session.

## Status: Branded email templates + unsubscribe/resubscribe system (2026-08-02)

**Branded email templates**: refactored `src/lib/email.ts`'s three Resend-sent
emails (invite, reminder, verification) onto one shared `emailFrame` (paper/
ink card, wordmark, accent button) instead of two near-duplicate hand-rolled
copies. Added `supabase/email-templates/` — branded HTML for the four
Supabase Auth emails this app actually triggers (confirm signup, reset
password, password changed, new sign-in method linked — confirmed against
`auth-actions.ts`; Magic Link/Invite/Reauthentication skipped since nothing
sends them), generated from one shared script
(`scripts/build-auth-email-templates.mjs`) so all four stay in sync. A
README documents which Supabase Dashboard slot each goes in — these are
Dashboard-configured, not deployed by code. Deliverability pass: `from`
address now always carries a display name, `replyTo` set to the support
inbox already linked from the Privacy Policy (previously unused anywhere),
`List-Unsubscribe` header added.

**Unsubscribe/resubscribe system**: new `email_unsubscribes` table
(`event_id` + `email`, unique — scoped per-event, not global, matching the
`host_id` invariant's spirit: opting out of one host's reminders shouldn't
silently drop a different host's emails too). Every invite/reminder/
verification email now carries a signed, no-login unsubscribe link
(`src/lib/unsubscribe-token.ts`, HMAC via the existing `GUEST_SESSION_SECRET`)
— clicking it unsubscribes immediately (`/unsubscribe` route handler),
lands on a confirmation page with an inline "Undo" action.
`deliverInviteEmail`/`deliverReminderEmail` now check the suppression list
first and return `{ sent: boolean }`; the host-facing send actions and UI
(single-invite button, bulk-reminder toast) distinguish "suppressed" from
"failed" rather than treating an opted-out guest as an error.

Resubscribing is self-service but double-opt-in: `/resubscribe` collects
just an email, rate-limited at 2/day and 5/month **per email and
independently per IP** (`src/lib/data/rate-limit.ts` gained a peek/record
split so several independent window checks can be made before any of them
record a hit — needed since the existing `checkRateLimit` combines count+
insert in one call and can't be safely called twice for one logical
request). Submitting always returns the same generic message regardless of
outcome (anti-enumeration, matching `requestPasswordReset`) and emails a
short-lived confirmation link; clicking it is what actually clears every
event's suppression for that address. A compact version of the same form
is embedded in the marketing home page's footer band.

**Bugs found and fixed during live verification** (Playwright against the
running dev server, real DB writes, not just build-checked): an uncaught
exception when Resend rejects a `to` address (or any other send failure)
inside `requestResubscribe` — was propagating through the server action to
a raw error page instead of the intended generic message, now caught and
logged; the "Undo" action on the unsubscribe-confirmation page was
redirecting to the success page even when its token failed to verify,
falsely claiming a resubscribe that never happened. Also fixed a redundant
DB index (an explicit `(event_id, email)` index duplicating the unique
constraint's own implicit one) and a same-instance TOCTOU race in the new
rate-limit peek/record split (closed with an in-memory debounce floor,
same pattern as `guest-verification.ts`'s `MIN_MS_BETWEEN_REQUESTS`).

Manual step required (outside what this environment can do): the
`email_unsubscribes` table addition to `supabase/schema-saas.sql` had to be
run by the user directly in the Supabase SQL editor — no direct Postgres/
management-API access is available here, only PostgREST via the
service-role key.

`npm run build`, `npm run lint`, and `npm test` all clean (27/27 tests,
including 4 new for the token signer). End-to-end verified live: unsubscribe
insert, idempotent re-click, undo/row-removal, invalid-token handling,
cross-event resubscribe-confirm, and both the email-scoped and IP-scoped
rate-limit caps — confirmed directly against the database, not just the UI.
