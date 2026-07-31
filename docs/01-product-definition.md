# 01 — Product Definition

## Vision

**Ahvan** lets anyone create a beautiful, fully-customizable event invitation
page, share personal invite links with guests, and track every RSVP — without
design skills, spreadsheets, or paid plans.

The product's core differentiator (already built, must stay the hero): the
invitation page is **truly customizable** — a drag-and-drop block editor, an
editable RSVP form schema, per-block styling, nested containers, and a sandboxed
custom-code escape hatch. Competitors give you a template; Ahvan gives you a
page.

One sentence for the home page: *"Design the invitation. Share one link. Watch
the RSVPs arrive."*

## Personas

1. **The Host (primary)** — plans a wedding, birthday, baby shower, or party.
   Moderately tech-savvy, cares about how the invite *looks*, wants zero
   guest friction. Uses the dashboard on desktop, checks RSVPs on mobile.
2. **The Guest (secondary, but the real audience)** — opens a link on their
   phone, decides in seconds whether this looks legitimate and lovely, RSVPs in
   under a minute. Never creates an account. Mobile-first, always.
3. **The Power Host (tertiary)** — comfortable with HTML/CSS, wants pixel
   control. Served by the container/custom-CSS/custom-page features. Never let
   this persona's needs complicate the primary host's default flow.

## User stories (v1 — complete set)

### Account
- As a host, I sign up with email + password and land in my dashboard
  immediately. *(built)*
- As a host, I sign in/out and my session survives refreshes. *(built)*
- As a host, I can reset a forgotten password. **(gap — Phase 4)**

### Events
- As a host, I create an event with type, title, date/time, venue, and theme,
  and get a working public page instantly. *(built)*
- As a host, I edit any event detail later and the public page updates. *(built)*
- As a host, I control whether my page is live: **draft → published**, so I can
  design before anyone can see it. **(gap — Phase 4; the only new event-level
  feature in v1)**
- As a host, I set an optional RSVP deadline after which the form closes
  gracefully. **(gap — Phase 4)**
- As a host, I delete an event and everything under it. *(built)*

### Design (page builder)
- As a host, I rearrange, add, remove, and configure page blocks with live
  preview. *(built)*
- As a host, I pick a theme and nudge its colors/fonts without leaving it.
  *(built: colors; Phase 2 adds per-theme typography)*
- As a host, I upload images rather than pasting URLs. **(gap — Phase 4,
  Supabase Storage)**
- As a power host, I add custom HTML/CSS/JS safely (sandboxed). *(built)*

### RSVP form (form builder)
- As a host, I add/edit/reorder/delete any form field, including the built-in
  ones. *(built)*
- As a guest, I open my personal link, see my name pre-filled, and RSVP in
  under a minute; I can come back and change my answer. *(built)*

### Guests & tracking
- As a host, I create named invites (optionally with email) and copy/share each
  personal link. *(built)*
- As a host, I see attending/declined/total-guest stats, search, sort, filter,
  and edit any RSVP. *(built)*
- As a host, I export my guest list + responses to CSV. **(gap — Phase 4;
  cheap, high-value, replaces the spreadsheet)**
- As a host, I email an invite or bulk reminders and see per-send success/
  failure. *(built; delivery blocked on domain verification — Phase 5 task)*

## Use cases that must stay effortless (test scripts, essentially)

1. **Two-minute event**: signup → create event → copy first invite link →
   open link in incognito → RSVP. Must require zero documentation.
2. **The redesign**: host opens Invite page tab, swaps theme, moves the RSVP
   form above the map, adds a photo, saves — guest link reflects it on refresh.
3. **The follow-up**: a week out, host bulk-emails reminders to everyone with
   an email who hasn't responded, watches the pending list shrink.
4. **The audit**: host edits a guest's RSVP by phone-call proxy; stats update.
5. **The skeptic guest**: guest with no invite param sees a beautiful page and
   a graceful "by invitation" note, not an error.

## Feature matrix — final for v1

**Rule: no redundant features.** Every capability exists exactly once, at one
place in the UI. Where two mechanisms overlap today, they are consolidated
(see below), not duplicated.

### Keep as-is (the product core)
- Supabase Auth accounts; host-scoped multi-tenancy
- Event CRUD + slug-addressed public pages
- Block page builder (hero, text, image, image carousel, spacer, countdown,
  rsvp-form, venue-map, container, custom-html) + layout controls
  (per-block width/align/spacing, plus optional per-device mobile/tablet
  overrides — hide, resize, or realign a block without touching desktop)
  + live preview
- Form builder with role-tagged fields + graceful stat degradation
- Guest dashboard (tabs/search/sort/stats/edit) + invite links
- Email invites + manual bulk reminders with `email_sends` audit log
- Sandboxed custom code (block-level and whole-page)

### Consolidate (same power, less surface — Phase 1–2 work)
- **Styling surfaces**: block `customCss`, container `customStyle`, page
  `pageStyle`, `themeOverrides`, `fontFamily` are five entry points to one
  idea. Consolidate the *UI* into a single mental model — one "Style" panel
  with three scopes (Theme / Page / Selected block), each showing the same
  control vocabulary (colors, spacing, advanced CSS). Storage stays as-is;
  this is a presentation consolidation, not a schema change.
- **Custom code**: block-level custom-html and page-level customPage present
  as one "Custom code" feature with a scope switch, not two separate features.
- **Event details forms**: `events/new` and `settings` duplicate the same
  field set — one shared `EventDetailsForm` component, two thin wrappers.
- **Send-email affordances**: per-invite mail icon + bulk button stay, but
  share one send-status component and one copy voice.

### New in v1 (the only additions — all in Phase 4)
- Draft/published event status
- Optional RSVP deadline (closes the form politely)
- Image upload (Supabase Storage) wherever an image URL is asked for today
- CSV export of guests + responses
- Password reset flow
- Marketing home page rebuild (Phase 3, spec in `06-home-page.md`)

### Explicitly deferred (do not build, even if asked casually — re-confirm first)
- Billing/paid plans, teams/multi-user hosts, guest accounts
- Comments/well-wishes wall, photo sharing/shared albums
- Scheduled/automatic reminders (cron), SMS
- QR codes, calendar (.ics) attachments, per-guest +N seat allowances
- Template marketplace, AI content generation
- i18n/localization
