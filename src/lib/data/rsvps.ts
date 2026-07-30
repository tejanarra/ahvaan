import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError, NotFoundError } from "@/lib/data/errors";
import type { Responses } from "@/lib/schemas/form-schema";

export type RsvpRecord = {
  id: string;
  event_id: string;
  host_id: string;
  invite_id: string | null;
  name: string;
  attending: boolean;
  additional_guests: string[];
  responses: Responses;
  created_at: string;
};

const COLUMNS =
  "id, event_id, host_id, invite_id, name, attending, additional_guests, responses, created_at";

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

export async function listRespondedInviteIds(eventId: string): Promise<Set<string>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("rsvps").select("invite_id").eq("event_id", eventId);
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

export type SubmitRsvpInput = {
  eventId: string;
  hostId: string;
  inviteId: string;
  responses: Responses;
  scalars: RsvpScalars;
};

// Upserting on the unique invite_id constraint makes "resubmitting updates
// the existing row" atomic — a check-then-insert/update pattern here would
// race under concurrent/duplicate submissions.
export async function upsertRsvpPublic(input: SubmitRsvpInput) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rsvps").upsert(
    {
      event_id: input.eventId,
      host_id: input.hostId,
      invite_id: input.inviteId,
      responses: input.responses,
      ...input.scalars,
    },
    { onConflict: "invite_id" }
  );
  if (error) throw new DataError(error.message);
}
