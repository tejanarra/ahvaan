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
