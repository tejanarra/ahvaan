-- Run this once in the Supabase SQL editor (or via the CLI) to set up the RSVP table.
--
-- Named "wedding_rsvps" (not "rsvps") because this project's Supabase instance
-- already has an unrelated "rsvps" table (guest_id/headcount based) from a
-- different schema — this avoids colliding with it.

create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending boolean not null,
  additional_guests text[] not null default '{}',
  message text,
  created_at timestamptz not null default now()
);

alter table public.wedding_rsvps enable row level security;

-- No policies are created on purpose: the app only talks to this table using the
-- Supabase service role key from server-side code, which bypasses RLS. Anonymous
-- clients (e.g. the browser using the anon key) have no access at all.
