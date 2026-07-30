import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { eventExists } from "@/lib/data/events";
import { DataError, NotFoundError } from "@/lib/data/errors";

export type InviteRecord = {
  id: string;
  event_id: string;
  host_id: string;
  name: string;
  email: string | null;
  created_at: string;
};

const COLUMNS = "id, event_id, host_id, name, email, created_at";

export async function listInvites(hostId: string, eventId: string): Promise<InviteRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .select(COLUMNS)
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw new DataError(error.message);
  return (data ?? []) as InviteRecord[];
}

export async function createInvite(hostId: string, eventId: string, name: string, email: string | null) {
  if (!(await eventExists(hostId, eventId))) {
    throw new NotFoundError("Event not found.");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ event_id: eventId, host_id: hostId, name, email })
    .select("id")
    .single();

  if (error || !data) throw new DataError(error?.message ?? "Failed to create invite.");
  revalidatePath(`/dashboard/events/${eventId}`);
  return data.id as string;
}

export async function deleteInvite(hostId: string, eventId: string, inviteId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .eq("host_id", hostId);
  if (error) throw new DataError(error.message);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function getEmailableInvite(hostId: string, eventId: string, inviteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, name, email")
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Invite not found.");
  if (!data.email) throw new DataError(`${data.name} doesn't have an email address on file.`);

  return data as { id: string; name: string; email: string };
}

export async function listPendingInvitesWithEmail(hostId: string, eventId: string, respondedInviteIds: Set<string>) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, name, email")
    .eq("event_id", eventId)
    .eq("host_id", hostId)
    .not("email", "is", null);
  if (error) throw new DataError(error.message);

  return ((data ?? []) as { id: string; name: string; email: string }[]).filter(
    (inv) => !respondedInviteIds.has(inv.id)
  );
}

// Guest-facing lookup — deliberately unscoped by host_id (the invite id
// itself is the access control for the public RSVP flow).
export async function getInvitePublic(eventId: string, inviteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, name")
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as { id: string; name: string } | null;
}

export async function getInviteForRsvpSubmissionPublic(eventId: string, inviteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, host_id")
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as { id: string; host_id: string } | null;
}
