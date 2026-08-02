import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError, NotFoundError } from "@/lib/data/errors";
import type { Responses } from "@/lib/schemas/form-schema";

export type RsvpRecord = {
  id: string;
  event_id: string;
  host_id: string;
  invite_id: string | null;
  email: string | null;
  name: string;
  attending: boolean;
  additional_guests: string[];
  responses: Responses;
  created_at: string;
};

const COLUMNS =
  "id, event_id, host_id, invite_id, email, name, attending, additional_guests, responses, created_at";

export async function listRsvps(hostId: string, eventId: string): Promise<RsvpRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select(COLUMNS)
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw new DataError(error.message);
  return (data ?? []) as RsvpRecord[];
}

export async function listRespondedInviteIds(hostId: string, eventId: string): Promise<Set<string>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("invite_id")
    .eq("event_id", eventId)
    .eq("host_id", hostId);
  if (error) throw new DataError(error.message);
  return new Set((data ?? []).map((r) => r.invite_id).filter(Boolean) as string[]);
}

export async function deleteRsvp(hostId: string, eventId: string, rsvpId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("id", rsvpId)
    .eq("event_id", eventId)
    .eq("host_id", hostId);
  if (error) throw new DataError(error.message);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export type RsvpScalars = { name: string; attending: boolean; additional_guests: string[] };

// Cheap pre-read used only to carry forward a guest's existing name when a
// host edits a response on a schema with no name-role field (see
// deriveLegacyScalars's `fallbackName`) — without this, recomputing scalars
// from a fields-less/name-less schema would blank a real name back to the
// generic "Guest" placeholder on every edit.
export async function getRsvpName(hostId: string, eventId: string, rsvpId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("name")
    .eq("id", rsvpId)
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data?.name ?? null;
}

export async function updateRsvp(
  hostId: string,
  eventId: string,
  rsvpId: string,
  responses: Responses,
  scalars: RsvpScalars
) {
  const supabase = createServiceRoleClient();
  // .select().maybeSingle() is required here, not just to read the row
  // back, but because without it Supabase reports no error at all when the
  // id/event_id/host_id combination matches zero rows.
  const { data, error } = await supabase
    .from("rsvps")
    .update({ responses, ...scalars })
    .eq("id", rsvpId)
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .select("id")
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("This RSVP no longer exists — it may have been deleted.");
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function getRsvpForInvitePublic(inviteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("name, attending, additional_guests, responses")
    .eq("invite_id", inviteId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as Pick<RsvpRecord, "name" | "attending" | "additional_guests" | "responses"> | null;
}

// Guest-facing "already responded? retrieve it" lookup for the
// 'email_verified' RSVP mode — same role as
// form-submissions.ts's getSubmissionForEmailPublic, an explicit guest
// action, not an automatic page-load lookup, and rate-limited by the
// caller (src/lib/rsvp-submit.ts's isThrottled).
export async function getRsvpForEmailPublic(eventId: string, email: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("name, attending, additional_guests, responses")
    .eq("event_id", eventId)
    .eq("email", email)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as Pick<RsvpRecord, "name" | "attending" | "additional_guests" | "responses"> | null;
}

export type SubmitRsvpInput = {
  eventId: string;
  hostId: string;
  // Exactly one of these is ever set, matching the event's
  // submission_mode (src/lib/rsvp-submit.ts's mode branch): inviteId
  // for 'private' (or an invite-holding 'email_verified' guest — see that
  // file's invite-bypass), email for an un-invited 'email_verified' guest,
  // neither for 'anonymous'.
  inviteId?: string | null;
  email?: string | null;
  responses: Responses;
  scalars: RsvpScalars;
};

// Upserting on a unique constraint makes "resubmitting updates the
// existing row" atomic — a check-then-insert/update pattern here would
// race under concurrent/duplicate submissions. Which constraint depends on
// which identity this submission carries; 'anonymous' (neither) has no
// dedup target, so it's a plain insert — every submission is its own row.
export async function upsertRsvpPublic(input: SubmitRsvpInput) {
  const supabase = createServiceRoleClient();
  const row = {
    event_id: input.eventId,
    host_id: input.hostId,
    invite_id: input.inviteId ?? null,
    email: input.email ?? null,
    responses: input.responses,
    ...input.scalars,
  };

  if (input.inviteId) {
    const { error } = await supabase.from("rsvps").upsert(row, { onConflict: "invite_id" });
    if (error) throw new DataError(error.message);
    return;
  }
  if (input.email) {
    const { error } = await supabase.from("rsvps").upsert(row, { onConflict: "event_id,email" });
    if (error) throw new DataError(error.message);
    return;
  }
  const { error } = await supabase.from("rsvps").insert(row);
  if (error) throw new DataError(error.message);
}
