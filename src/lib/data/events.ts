import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/event-types";
import type { ThemeId } from "@/lib/themes";
import { NotFoundError, DataError } from "@/lib/data/errors";

export type EventStatus = "draft" | "published";

export type EventRecord = {
  id: string;
  host_id: string;
  slug: string;
  event_type: EventType;
  theme_id: ThemeId;
  title: string;
  subtitle: string | null;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  description: string | null;
  cover_image_url: string | null;
  form_schema: unknown;
  page_schema: unknown;
  status: EventStatus;
  rsvp_deadline: string | null;
  // Post-submit behavior for the RSVP form (src/lib/schemas/post-submit-
  // actions.ts) — null = synthesize from the rsvp-form block's legacy
  // confirmation fields if present, else the plain hardcoded defaults (see
  // rsvp-form.tsx's synthesizeLegacyRsvpAction). Raw/unparsed here, same as
  // form_schema/page_schema — callers parse via parsePostSubmitAction.
  rsvp_actions: unknown;
  // Who's allowed to submit — one event-wide setting governing BOTH the
  // RSVP form and every generic Forms form under this event
  // (src/lib/schemas/submission-mode.ts), not a separate per-form choice.
  // Raw here like rsvp_actions above, callers parse via parseSubmissionMode.
  // 'private' (the DB default) matches RSVP's original, only-ever behavior.
  submission_mode: unknown;
  created_at: string;
};

// The dashboard list card only needs these — never the (often large)
// form_schema/page_schema jsonb columns (see docs/03, W3).
export type EventSummary = Pick<
  EventRecord,
  "id" | "slug" | "title" | "event_type" | "event_date" | "theme_id" | "status" | "created_at"
>;

const SUMMARY_COLUMNS = "id, slug, title, event_type, event_date, theme_id, status, created_at";
const FULL_COLUMNS =
  "id, host_id, slug, event_type, theme_id, title, subtitle, event_date, event_time, venue_name, venue_address, description, cover_image_url, form_schema, page_schema, status, rsvp_deadline, rsvp_actions, submission_mode, created_at";
// The public page needs `status`/`host_id` only to decide draft visibility
// (see requireVisiblePublicEvent in src/app/events/[slug]/page.tsx) — never
// rendered to a guest. `cover_image_url` is included here (unlike most host-
// only fields) because generateMetadata reads it straight off this same
// public row to build the guest page's og:image.
const PUBLIC_COLUMNS =
  "id, host_id, slug, event_type, theme_id, title, subtitle, event_date, event_time, venue_name, venue_address, description, cover_image_url, form_schema, page_schema, status, rsvp_deadline, rsvp_actions, submission_mode";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// Appending a short random suffix (rather than retrying on a unique-
// constraint violation) keeps event creation a single insert — collisions
// on an 8-hex-char suffix are astronomically unlikely for this scale.
export function makeEventSlug(title: string) {
  const base = slugify(title) || "event";
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}

export async function listEvents(hostId: string): Promise<EventSummary[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select(SUMMARY_COLUMNS)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });

  if (error) throw new DataError(error.message);
  return (data ?? []) as EventSummary[];
}

export async function getEventFull(hostId: string, eventId: string): Promise<EventRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select(FULL_COLUMNS)
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) throw new DataError(error.message);
  return data as EventRecord | null;
}

export async function requireEventFull(hostId: string, eventId: string): Promise<EventRecord> {
  const event = await getEventFull(hostId, eventId);
  if (!event) throw new NotFoundError("Event not found.");
  return event;
}

// Cheap existence + ownership check, used before attaching child rows
// (invites) to an event without pulling the whole row.
export async function eventExists(hostId: string, eventId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return Boolean(data);
}

export async function getEventNav(hostId: string, eventId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, slug, status")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as { id: string; title: string; slug: string; status: EventStatus } | null;
}

type GetEventBySlugPublicFn = (slug: string) => Promise<EventRecord | null>;

// Cached because /e/[slug] is read on every guest visit but only changes
// when a host saves — tagged per-slug so a save can precisely revalidate
// just that event (see revalidateEventCache below).
const getEventBySlugPublicCached: GetEventBySlugPublicFn = unstable_cache(
  async (slug: string) => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("events").select(PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();
    if (error) throw new DataError(error.message);
    return data as EventRecord | null;
  },
  ["event-by-slug-public"],
  { tags: [] }
);

// unstable_cache's static `tags` option can't be templated per-call, so the
// per-slug tag is applied via revalidateTag at the call site of writes
// instead (see revalidateEventCache) — reads go through this wrapper so the
// cache key still varies by slug while every write for that slug is
// addressable via `event:{slug}`.
export async function getEventBySlugPublic(slug: string): Promise<EventRecord | null> {
  return getEventBySlugPublicCached(slug);
}

// For the 'anonymous'/'email_verified' RSVP submission paths (src/lib/rsvp-
// submit.ts) — those modes have no invite row to resolve host_id from
// (getInviteForRsvpSubmissionPublic's job for 'private'), so the event
// itself, looked up by the id the client submitted, is host_id's source
// instead. Not cached (uncommon path, unlike the real page-render read
// above) — a plain query is fine here.
//
// Filtered to `status = 'published'` like the public page (see
// requireVisiblePublicEvent) — every caller only uses this to authorize a
// guest-facing write (RSVP/form submit, email verification request), and a
// draft event's id is never rendered anywhere a guest can see it, so
// treating a still-draft event as "not found" here closes off writes
// against an unpublished event even if its id ever leaked out-of-band.
export async function getEventByIdPublic(eventId: string): Promise<EventRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select(PUBLIC_COLUMNS)
    .eq("id", eventId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as EventRecord | null;
}

export function revalidateEventCache(eventId: string, slug: string) {
  revalidateTag(`event:${slug}`, "max");
  revalidatePath(`/events/${slug}`);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export type CreateEventInput = {
  hostId: string;
  title: string;
  eventType: string;
  themeId: string;
  eventDate: string | null;
  eventTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  subtitle: string | null;
  description: string | null;
  pageSchema: unknown;
};

export async function createEvent(input: CreateEventInput): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: input.hostId,
      slug: makeEventSlug(input.title),
      event_type: input.eventType,
      theme_id: input.themeId,
      title: input.title,
      subtitle: input.subtitle,
      event_date: input.eventDate,
      event_time: input.eventTime,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      description: input.description,
      page_schema: input.pageSchema,
      // Every new event starts as a draft (docs/01 "New in v1") — the host
      // designs the page/form privately, then publishes when ready. Existing
      // events predating this feature default to 'published' at the column
      // level so nothing already shared goes dark.
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) throw new DataError(error?.message ?? "Failed to create event.");
  return data.id as string;
}

export type UpdateEventInput = Omit<CreateEventInput, "hostId" | "pageSchema">;

export async function updateEventDetails(hostId: string, eventId: string, input: UpdateEventInput) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      event_type: input.eventType,
      theme_id: input.themeId,
      title: input.title,
      subtitle: input.subtitle,
      event_date: input.eventDate,
      event_time: input.eventTime,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      description: input.description,
    })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

export async function updateEventStatus(hostId: string, eventId: string, status: EventStatus) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
  revalidatePath("/dashboard");
}

export async function updateRsvpDeadline(hostId: string, eventId: string, rsvpDeadline: string | null) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ rsvp_deadline: rsvpDeadline })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

export async function updateRsvpActions(hostId: string, eventId: string, actions: unknown) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ rsvp_actions: actions })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

// One event-wide setting governing both RSVP and every generic Forms form
// under this event — see events.submission_mode's own comment.
export async function updateSubmissionMode(hostId: string, eventId: string, mode: unknown) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ submission_mode: mode })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

// Separate from updateEventDetails (like updateRsvpDeadline) rather than
// folded into EventDetailsFields/CreateEventInput: that form is shared with
// events/new, where there's no eventId yet for ImageUploadField to upload
// against (uploadEventImage's storage path is keyed by eventId) — this
// field is only ever settable post-creation, from Settings.
export async function updateCoverImage(hostId: string, eventId: string, coverImageUrl: string | null) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ cover_image_url: coverImageUrl })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

export async function deleteEvent(hostId: string, eventId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId).eq("host_id", hostId);
  if (error) throw new DataError(error.message);
  revalidatePath("/dashboard");
}

export async function updateFormSchema(hostId: string, eventId: string, schema: unknown) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ form_schema: schema })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
}

export async function updatePageSchema(hostId: string, eventId: string, schema: unknown) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ page_schema: schema })
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id, slug")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Event not found.");

  revalidateEventCache(eventId, data.slug as string);
  revalidatePath(`/dashboard/events/${eventId}/design`);
}
