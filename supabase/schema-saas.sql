-- Run this once in the new SaaS Supabase project's SQL editor.
--
-- Multi-tenant schema: every host is a Supabase auth.users row, and every
-- event/invite/rsvp belongs to exactly one host. host_id is denormalized
-- onto invites and rsvps (not just reachable via a join through events) so
-- every authorization check in application code is a single
-- `.eq("host_id", userId)` filter — the app (via the service-role client)
-- is what enforces tenancy, the same trust model already used by the
-- original single-tenant app, just keyed by a real user id instead of one
-- shared admin password. RLS is enabled with no policies, purely as a
-- backstop: the anon/authenticated keys have zero access to these tables
-- either way, so a leaked anon key can't read anyone's data.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  event_type text not null default 'other',
  theme_id text not null default 'classic-gold',
  title text not null,
  subtitle text,
  event_date date,
  event_time text,
  venue_name text,
  venue_address text,
  description text,
  cover_image_url text,
  -- null = use the default 3-field RSVP form / the fixed built-in page
  -- layout, respectively — existing events keep working unchanged.
  form_schema jsonb,
  page_schema jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_host_id_idx on public.events(host_id);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists invites_event_id_idx on public.invites(event_id);
create index if not exists invites_host_id_idx on public.invites(host_id);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  invite_id uuid references public.invites(id) on delete set null,
  name text not null,
  attending boolean not null,
  additional_guests text[] not null default '{}',
  -- Schema-driven answers, keyed by form field id (see src/lib/form-schema.ts).
  -- The scalar columns above are kept forever as a fast-path/historical
  -- fallback, derived from `responses` on every write, not just during a
  -- migration window.
  responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (invite_id)
);

create index if not exists rsvps_event_id_idx on public.rsvps(event_id);
create index if not exists rsvps_host_id_idx on public.rsvps(host_id);

-- Identity for the 'email_verified' submission mode (see
-- events.rsvp_submission_mode below) — 'private' mode keeps using
-- invite_id/unique(invite_id) above unchanged; 'anonymous' mode leaves both
-- null on every row (no dedup). Lowercased/trimmed at write time, same
-- reasoning as form_submissions.email above.
alter table public.rsvps add column if not exists email text;
-- Deliberately NOT a partial index (no `where` clause): Postgres already
-- treats every NULL as distinct under a plain unique index, so
-- private/anonymous rows (email always null) never collide on their own —
-- a partial index isn't needed for that. It matters for a different
-- reason: Supabase's `.upsert(row, {onConflict:"event_id,email"})` emits a
-- bare `ON CONFLICT (event_id, email)`, which Postgres only accepts if it
-- exactly matches an existing constraint/index — a partial index (with a
-- `where` predicate) doesn't match a predicate-less ON CONFLICT target and
-- raises 42P10 at write time (this was caught live: every anonymous+email
-- RSVP/form submission failed with "Something went wrong saving..." until
-- these were changed to plain indexes).
drop index if exists public.rsvps_email_unique;
create unique index if not exists rsvps_email_unique
  on public.rsvps(event_id, email);

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites(id) on delete cascade,
  kind text not null, -- 'invite' | 'reminder'
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

create index if not exists email_sends_invite_id_idx on public.email_sends(invite_id);

-- Phase 0 additive columns (docs/03-codebase-restructure.md W7 + Phase 4
-- prep) — host_id/event_id let the audit log be queried without a join
-- through invites; error captures the failure message instead of
-- overloading status with 'failed: <msg>'; status/rsvp_deadline on events
-- are the Phase 4 draft/publish + deadline columns, added now so the
-- schema file only needs one more re-run before that phase lands.
alter table public.email_sends add column if not exists host_id uuid references auth.users(id) on delete cascade;
alter table public.email_sends add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.email_sends add column if not exists error text;
create index if not exists email_sends_event_id_idx on public.email_sends(event_id);

alter table public.events add column if not exists status text not null default 'published';
alter table public.events add column if not exists rsvp_deadline timestamptz;
-- Post-submit behavior for the RSVP form — same shape/validation as
-- forms.actions above (src/lib/schemas/post-submit-actions.ts). Null =
-- synthesize the old hardcoded defaults (see rsvp-form.tsx), so existing
-- events keep rendering identically with no backfill required.
alter table public.events add column if not exists rsvp_actions jsonb;
-- Who's allowed to submit — one event-wide setting governing BOTH the RSVP
-- form and every generic Forms form under this event (see
-- src/lib/schemas/submission-mode.ts), not a separate per-form choice: if a
-- host wants email verification, they want it everywhere on the event, not
-- toggled form-by-form. Originally shipped as `rsvp_submission_mode`
-- (RSVP-only) before Forms lost its own independent `forms.submission_mode`
-- column below — renamed once, idempotently, since plain `alter table
-- rename column` errors if the source column is already gone on a re-run.
-- 'private' matches the RSVP form's original, only-ever behavior (a
-- personal invite link is required), so this column changes nothing for
-- any event that never touches the Guests → Settings tab.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'rsvp_submission_mode'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'submission_mode'
  ) then
    alter table public.events rename column rsvp_submission_mode to submission_mode;
  end if;
end $$;
alter table public.events add column if not exists submission_mode text not null default 'private';
-- App-level validation (parseSubmissionMode) already rejects anything else
-- before a write, but a DB-level constraint means a bad value can't land
-- here through any other path (a manual query, a future migration bug)
-- either. `not valid` skipped deliberately isn't needed here since this
-- column's default/every app write is already one of these three values.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_submission_mode_check'
  ) then
    alter table public.events
      add constraint events_submission_mode_check
      check (submission_mode in ('private', 'anonymous', 'email_verified'));
  end if;
end $$;

alter table public.events enable row level security;
alter table public.invites enable row level security;
alter table public.rsvps enable row level security;
alter table public.email_sends enable row level security;

-- Additive columns for projects that ran this file before form_schema/
-- page_schema/responses existed — safe to re-run, no-ops if already present.
alter table public.events add column if not exists form_schema jsonb;
alter table public.events add column if not exists page_schema jsonb;
alter table public.rsvps add column if not exists responses jsonb not null default '{}'::jsonb;

-- Reusable custom components: a host names a Custom HTML/CSS/JS block (any
-- event) to save it here on the next page save, then references it from
-- *any* block's HTML (any event) via <custom-component name="..." /> —
-- attributes on that tag become {{attr}} tokens inside the saved snippet, no
-- separate prop schema. See lib/blocks/shortcodes.ts and
-- dashboard/events/[eventId]/actions.ts's updatePageSchema. Same
-- host-scoping/RLS-backstop model as every table above. (`props` is unused —
-- kept only because it already shipped to production; harmless to leave.)
create table if not exists public.custom_components (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  html text not null default '',
  css text not null default '',
  js text not null default '',
  props jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists custom_components_host_id_idx on public.custom_components(host_id);
alter table public.custom_components enable row level security;

-- Generic host-built forms (any name, any field set) — deliberately
-- separate from the RSVP/guest-tracking tables above rather than unified
-- with them: RSVP's `attending`/`plus_ones` role-tagged fields drive the
-- Guests dashboard's stats and are tied one-to-one to `invites`, which a
-- generic, anonymous-submission form has no equivalent of. See
-- src/lib/forms/ for the field-type engine and src/lib/data/forms.ts.
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  schema jsonb not null default '{"fields": []}'::jsonb,
  -- Post-submit behavior (message / redirect / custom HTML) — see
  -- src/lib/schemas/post-submit-actions.ts. Same shape reused by
  -- events.rsvp_actions below.
  actions jsonb not null default '{"kind":"message","heading":"Thanks!","message":"Your response has been recorded."}'::jsonb,
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

create index if not exists forms_host_id_idx on public.forms(host_id);
create index if not exists forms_event_id_idx on public.forms(event_id);
alter table public.forms enable row level security;

-- Forms briefly had its own `submission_mode` column here; dropped in favor
-- of one event-wide setting (events.submission_mode above) shared with
-- RSVP — a host who wants email verification wants it for every form on
-- the event, not toggled per-form. `if exists` so re-running this file is
-- a no-op once already dropped.
alter table public.forms drop column if exists submission_mode;

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  -- Denormalized (reachable via a join through forms) to match every other
  -- host-scoped table in this file — every host-scoped query filters
  -- host_id directly, never via a join (docs/02-architecture-review.md).
  host_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists form_submissions_form_id_idx on public.form_submissions(form_id);
create index if not exists form_submissions_host_id_idx on public.form_submissions(host_id);
alter table public.form_submissions enable row level security;

-- Same "added after the table already shipped" story as forms.
-- submission_mode above — identity for 'private'/'email_verified' modes,
-- both null for 'anonymous' (no dedup, every submit is a fresh row).
-- Always lowercased/trimmed at write time so the plain (non-expression)
-- unique index below works as a case-insensitive dedup key — Postgrest's
-- upsert `onConflict` can only target real columns, not `lower(email)`.
alter table public.form_submissions add column if not exists invite_id uuid references public.invites(id) on delete set null;
alter table public.form_submissions add column if not exists email text;
-- One submission per invite (private mode) / per email (email_verified
-- mode) — plain (non-partial) indexes, not partial ones: Postgres already
-- treats every NULL as distinct under a plain unique index, so unlimited
-- anonymous-mode rows (both columns null) are unaffected without needing a
-- `where` predicate. A partial index breaks Supabase's
-- `.upsert(row, {onConflict:"..."})`, which emits a bare `ON CONFLICT
-- (cols)` that only matches a predicate-less constraint/index — see the
-- matching comment above rsvps_email_unique for the live failure this caused.
drop index if exists public.form_submissions_invite_unique;
drop index if exists public.form_submissions_email_unique;
create unique index if not exists form_submissions_invite_unique
  on public.form_submissions(form_id, invite_id);
create unique index if not exists form_submissions_email_unique
  on public.form_submissions(form_id, email);
-- Every public page render batches submissions across every form on the
-- event in one query (listSubmissionsForInvitePublic/
-- listSubmissionsForEmailPublic in src/lib/data/form-submissions.ts),
-- filtered by (event_id, invite_id)/(event_id, email) — neither is served
-- by the per-form unique indexes above (those lead with form_id, not
-- event_id), so this is the hottest guest-facing read on the table.
create index if not exists form_submissions_event_invite_idx
  on public.form_submissions(event_id, invite_id);
create index if not exists form_submissions_event_email_idx
  on public.form_submissions(event_id, email);

-- Guest-facing OTP verification for the 'email_verified' submission mode
-- (RSVP and generic Forms both use this one table). Genuinely proves the
-- guest controls the email they typed, unlike a bare email string: a
-- 6-digit code is emailed out, and the pending submission (or, for a
-- lookup, nothing — just the fact of matching an existing row) is only
-- acted on once the guest echoes that code back. `payload` carries the
-- fully-built responses/scalars for a 'submit' verification so the guest
-- doesn't have to re-enter their answers after checking their inbox; it's
-- null for an 'identity' verification, which only proves email ownership
-- (src/lib/guest-verification.ts) — nothing to write yet, and no payload
-- to leak if consumed through the wrong purpose (see the `purpose` filter
-- in verifyCode/src/lib/data/email-verification.ts). No `host_id` — this
-- is a pre-auth, guest-only artifact, never queried by the dashboard.
create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null, -- 'rsvp' | 'form'
  subject_id uuid not null,   -- events.id (rsvp) or forms.id (form)
  purpose text not null,      -- 'submit' | 'identity'
  email text not null,
  code_hash text not null,
  payload jsonb,
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'email_verification_codes_subject_type_check'
  ) then
    alter table public.email_verification_codes
      add constraint email_verification_codes_subject_type_check
      check (subject_type in ('rsvp', 'form'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'email_verification_codes_purpose_check'
  ) then
    alter table public.email_verification_codes
      add constraint email_verification_codes_purpose_check
      check (purpose in ('submit', 'identity'));
  end if;
end $$;

create index if not exists email_verification_codes_lookup_idx
  on public.email_verification_codes(subject_type, subject_id, email, purpose);
-- Served by nothing above: createVerificationCode's best-effort prune
-- sweep (src/lib/data/email-verification.ts) deletes by `created_at`
-- alone, on every single code creation — without this index that's a
-- full table scan each time.
create index if not exists email_verification_codes_created_at_idx
  on public.email_verification_codes(created_at);

alter table public.email_verification_codes enable row level security;

-- Phase 4: host-uploaded images (hero cover, Image block). Public-read (a
-- public bucket serves objects straight from its public URL, no auth
-- header, independent of storage.objects RLS) — every write goes through
-- the service-role client (src/lib/data/storage.ts), same "service-role
-- write, RLS as backstop only" model as every table above, so no
-- storage.objects policies are needed. `file_size_limit`/
-- `allowed_mime_types` are a second, DB-level enforcement of the same 5MB/
-- image-type limits already checked in application code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Phase 5 (docs/08 "RLS policies (defense-in-depth)"): the app never
-- queries with the anon/authenticated key — every read/write already goes
-- through the service-role client, scoped by an application-code
-- `host_id = <server-verified user>` filter (docs/02's primary
-- authorization model). These policies change nothing about how the app
-- behaves; they're a second, independent layer so a leaked anon key, a
-- future accidental client-side query, or a bug that drops the app-code
-- filter still can't read or write another host's rows — anon keeps zero
-- access (public reads stay service-role-only), authenticated is scoped
-- to `auth.uid()`. `drop policy if exists` + `create policy` keeps this
-- block idempotent like everything else in this file.
drop policy if exists "host owns their events" on public.events;
create policy "host owns their events" on public.events
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their invites" on public.invites;
create policy "host owns their invites" on public.invites
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their rsvps" on public.rsvps;
create policy "host owns their rsvps" on public.rsvps
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their email_sends" on public.email_sends;
create policy "host owns their email_sends" on public.email_sends
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their custom_components" on public.custom_components;
create policy "host owns their custom_components" on public.custom_components
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their forms" on public.forms;
create policy "host owns their forms" on public.forms
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

drop policy if exists "host owns their form_submissions" on public.form_submissions;
create policy "host owns their form_submissions" on public.form_submissions
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

-- Added 2026-08-02, user-directed, outside this file's original phase plan
-- (see docs/01 "Keep as-is" and SAAS_PLAN.md's dated entry): a host's
-- public-facing display name/bio/avatar, shown discreetly at the bottom of
-- their events' guest pages alongside a data-disclaimer. One row per host,
-- keyed directly by auth.users(id) (not its own uuid pk) since it's a
-- strict 1:1 extension of the host record, not an independent entity.
create table if not exists public.host_profiles (
  host_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.host_profiles enable row level security;

drop policy if exists "host owns their profile" on public.host_profiles;
create policy "host owns their profile" on public.host_profiles
  for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

-- Public-read bucket for host avatar photos — same "service-role write,
-- RLS as backstop only" model as event-images above.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'host-avatars',
  'host-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cross-instance rate limiting (docs/02 W9, docs/08 "Public write-path
-- limits") — src/lib/rate-limit.ts's in-memory `Map` only throttles within
-- one server instance, which silently under-enforces the moment this app
-- runs on more than one instance (e.g. multiple Vercel lambdas). This table
-- is the shared counter every instance reads/writes through
-- src/lib/data/rate-limit.ts, so a limit holds regardless of which instance
-- handles a given request. One row per hit (not a running counter column)
-- so a sliding window is just "count rows newer than now() - window" —
-- simplest correct implementation at this scale.
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_created_at_idx
  on public.rate_limit_hits(key, created_at);
-- Served by nothing above: src/lib/data/rate-limit.ts's global (not
-- key-scoped) prune sweep deletes by `created_at` alone, on every call —
-- without this the key-scoped index above wouldn't serve that query
-- efficiently. A key-scoped delete alone would leave a permanent row
-- behind for any key that's only ever hit once (the common case — most
-- invites/emails/IPs never generate a second hit), so this second sweep
-- is what actually bounds total table growth, not the per-key one.
create index if not exists rate_limit_hits_created_at_idx
  on public.rate_limit_hits(created_at);

alter table public.rate_limit_hits enable row level security;
-- No policy: service-role only (same pattern as email_verification_codes) —
-- this table has no per-host owner and is never read by the dashboard.

-- Unsubscribe suppression list — per (event, email), not global: a guest
-- opting out of one host's wedding reminders shouldn't silently also drop
-- them from a different host's baby-shower emails, so unsubscribing is
-- scoped to the event whose email they clicked "unsubscribe" from, exactly
-- like the host_id-scoping invariant already applies everywhere else
-- (see docs/reference/host-id-invariant). host_id is denormalized here for
-- the same reason as email_sends above: query without a join through
-- events. email is stored lowercased (enforced in
-- src/lib/data/email-unsubscribes.ts) so a case-different resend attempt
-- still matches an existing suppression.
create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  email text not null,
  unsubscribed_at timestamptz not null default now(),
  unique (event_id, email)
);

-- No separate (event_id, email) index needed: the unique constraint above
-- already creates one covering exactly that lookup (isUnsubscribed,
-- addUnsubscribe, removeUnsubscribe all filter by both columns). This one
-- is for removeAllUnsubscribesForEmail's bare `.eq("email", ...)` — the
-- composite index's leading column is event_id, so it can't serve an
-- email-only filter.
create index if not exists email_unsubscribes_email_idx
  on public.email_unsubscribes(email);

alter table public.email_unsubscribes enable row level security;
-- No policy: service-role only — checked/written from public (unauthenticated)
-- routes (the emailed unsubscribe link, the resubscribe form), never
-- directly from the dashboard's own session, same trust model as
-- email_verification_codes and rate_limit_hits above.
