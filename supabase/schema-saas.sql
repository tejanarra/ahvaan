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

alter table public.events enable row level security;
alter table public.invites enable row level security;
alter table public.rsvps enable row level security;
alter table public.email_sends enable row level security;
