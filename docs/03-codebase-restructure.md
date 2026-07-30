# 03 — Codebase Restructure & Optimization Plan

Executes weaknesses W1–W4, W6, W7 from doc 02. **This is Phase 0** — a pure
refactor: zero user-visible behavior change, verified by the doc-07 gate.

## Target directory layout

```
src/
  app/
    (marketing)/                 route group: public, no auth
      page.tsx                   home (rebuilt in Phase 3)
      login/ signup/ reset-password/
    (host)/                      route group: requireHost() in its layout
      dashboard/
        page.tsx                 event list
        events/new/page.tsx
        events/[eventId]/
          layout.tsx  page.tsx  (guests)
          design/  form/  settings/
          actions.ts             all event-scoped actions (single file)
      actions.ts                 createEvent (and only cross-event actions)
    e/[slug]/
      page.tsx  rsvp-form.tsx  actions.ts
    error.tsx  not-found.tsx  loading.tsx (Phase 5)
  components/
    ui/                          design-system primitives (doc 04 owns this)
    guest-dashboard/             host guest-management feature components
    builder/                     page-builder + form-builder editor UI
                                 (moved out of lib/ — editor-only, client)
    blocks-render/  (optional)   if any render component needs client hooks
  lib/
    blocks/                      PURE block system, no editor code:
      types.ts  registry.tsx  page-renderer.tsx  blocks/*.tsx  context.ts
    schemas/                     zod schemas + inferred types (NEW):
      page-schema.ts  form-schema.ts  responses.ts  event-input.ts
    data/                        the only Supabase surface (NEW):
      events.ts  invites.ts  rsvps.ts  email-log.ts
    supabase/  email.ts  themes.ts  event-types.ts  cn.ts
  proxy.ts
```

Moves (git mv, preserve history): `lib/page-blocks/*` render/type files →
`lib/blocks/`; builder-only files (`layout-controls-ui.tsx`, editor panels,
`sandbox.ts` if editor-only) → `components/builder/`; `lib/form-schema.ts` →
split: validation/types into `lib/schemas/form-schema.ts`, helpers stay
adjacent. `lib/event.ts` merges into `lib/data/events.ts` (types) —
`makeEventSlug` goes with it. Delete `lib/rsvp-limits.ts` if unused (verify).

## The data-access layer (W2, W3)

One module per aggregate. Rules:

1. **Signature rule**: every host-scoped function takes `hostId: string` as
   its first argument and applies `.eq("host_id", hostId)` internally.
   Guest-path functions are explicitly named `*Public` (e.g.
   `getPublishedEventBySlugPublic`) so an unscoped read is visible at the
   call site.
2. **Column rule**: no `select("*")`. Each function declares its column list
   as a `const` next to a matching return type. Key splits:
   - `listEvents(hostId)` → `id, slug, title, event_type, event_date, status,
     theme_id, created_at` (NO jsonb columns — this alone cuts the dashboard
     payload by ~90% for schema-heavy events).
   - `getEventFull(hostId, eventId)` → everything incl. schemas (settings/
     design/form pages).
   - `getEventBySlugPublic(slug)` → public-page columns only.
3. **Cache rule** (W4): `getEventBySlugPublic` wraps in `unstable_cache`
   tagged `event:{slug}`; every event-mutating action calls
   `revalidateTag("event:" + slug)` (and the dashboard paths). Invite + RSVP
   lookups stay uncached but run via `Promise.all` where independent.
4. **Error rule**: data functions throw typed errors (`NotFoundError`,
   `DataError`); pages translate to `notFound()` / error boundaries; actions
   translate to `{ error: string }` action state. No more silently-ignored
   `error` destructures.
5. Actions become thin: `requireHost()` → parse/validate input (zod from
   `lib/schemas/`) → call data fn → `revalidateTag`/`redirect`.

## Validation layer (W1)

Add `zod` (the only new dependency in Phase 0). For each JSONB document:

- `lib/schemas/page-schema.ts` — discriminated union mirroring
  `BlockInstance`; `parsePageSchema(raw): PageSchema | null` returns null on
  total garbage, and **filters out** (with a server-side `console.warn`)
  individual invalid blocks rather than failing the page. Container children
  validated recursively. All existing TS types become `z.infer` exports so
  types and validation can't drift.
- `lib/schemas/form-schema.ts` — same treatment for `FormSchema`; keep
  `resolveFormSchema`'s null→default behavior.
- `lib/schemas/responses.ts` — guest `submitRsvp` payload: max lengths
  (text 500, textarea 5000, ≤ 20 plus-ones, total serialized payload ≤ 64KB),
  option-membership via the existing shared `rsvp-validation` logic folded in.
- `lib/schemas/event-input.ts` — create/update event fields (title length,
  valid theme id, valid event type, date format), shared by `new` and
  `settings` actions.

Rule going forward: **no `as` cast on anything that crossed a serialization
boundary.** `EventRecord` reads come typed from the data layer.

## Naming & duplication cleanup (W6)

- Rename the *action* `sendInviteEmail` → `sendInviteEmailAction` (or rename
  the lib fn to `deliverInviteEmail`) — kill the collision.
- Merge `events/new` + `settings` duplicated fields into
  `components/event-details-form.tsx` (shared field set + theme picker), used
  by both with different submit actions.
- One `formatEventDate` util in `lib/format.ts` (currently raw ISO date
  strings render on cards).

## Schema migration (W7 + Phase 4 prep, additive & idempotent)

Append to `supabase/schema-saas.sql`:

```sql
alter table public.email_sends add column if not exists host_id uuid references auth.users(id) on delete cascade;
alter table public.email_sends add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.email_sends add column if not exists error text;          -- status stays 'sent'|'failed'
alter table public.events add column if not exists status text not null default 'published';  -- existing events stay live
alter table public.events add column if not exists rsvp_deadline timestamptz;
create index if not exists email_sends_event_id_idx on public.email_sends(event_id);
```

(`status` defaults to `'published'` so nothing already shared goes dark; the
Phase 4 UI makes *new* events start as `'draft'`.)

## Performance checklist (beyond queries)

- Dynamic-import the builder bundle: `design/page.tsx` and `form/page.tsx`
  load dnd-kit + editor chrome; guests and the dashboard list should never
  pay for it. Verify with `next build` route sizes (budget in doc 08).
- Replace raw `<img>` with `next/image` where dimensions are knowable
  (marketing, dashboard); guest-page image block keeps `<img>` (arbitrary
  remote URLs) until Phase 4's upload gives us known hosts — then migrate.
- Countdown block: ensure the interval timer mounts client-side only and
  cleans up; no other client timers exist.
- `LockBodyScroll` on the dashboard: fold into the layout's CSS
  (`overflow-hidden` on `html`/`body` via a route-group class) and delete the
  component if that proves equivalent.

## Definition of done for this restructure (the Phase 0 gate)

- `npm run build` passes; route output shows the dashboard list page no
  longer includes builder JS.
- Grep proof: no `select("*")`, no `from("events"|"invites"|"rsvps")` outside
  `lib/data/`, no `as PageSchema`/`as FormSchema`/`as EventRecord` anywhere.
- Live smoke: the five use-case scripts in doc 01 all pass unchanged.
- A corrupt `page_schema` (hand-set one block's `type` to `"nope"` in SQL)
  renders the page minus that block — no crash.
