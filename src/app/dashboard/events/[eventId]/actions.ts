"use server";

import { revalidatePath } from "next/cache";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendInviteEmail as sendInviteEmailViaResend, sendReminderEmail } from "@/lib/email";
import type { EventRecord } from "@/lib/event";
import { resolveFormSchema, deriveLegacyScalars, enforceRoleLock } from "@/lib/form-schema";
import type { FormSchema, Responses } from "@/lib/form-schema";
import { sanitizeResponses, validateResponses } from "@/lib/rsvp-validation";
import type { PageSchema } from "@/lib/page-blocks/types";

export async function createInvite(eventId: string, name: string, email?: string) {
  const host = await requireHost();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Guest name is required.");
  }
  const trimmedEmail = email?.trim() || null;

  const supabase = createServiceRoleClient();

  // Verify the event belongs to this host before attaching an invite to
  // it — otherwise a forged eventId in the request would let a host create
  // invites (denormalized host_id and all) against another host's event.
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();

  if (!event) {
    throw new Error("Event not found.");
  }

  const { data, error } = await supabase
    .from("invites")
    .insert({ event_id: eventId, host_id: host.id, name: trimmed, email: trimmedEmail })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invite.");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return data.id as string;
}

export async function deleteInvite(eventId: string, inviteId: string) {
  const host = await requireHost();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .eq("host_id", host.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteRsvp(eventId: string, rsvpId: string) {
  const host = await requireHost();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("id", rsvpId)
    .eq("event_id", eventId)
    .eq("host_id", host.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function updateRsvp(eventId: string, rsvpId: string, rawResponses: Responses) {
  const host = await requireHost();

  const supabase = createServiceRoleClient();

  const { data: event } = await supabase
    .from("events")
    .select("form_schema")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();
  if (!event) {
    throw new Error("Event not found.");
  }

  const schema = resolveFormSchema(event.form_schema);
  const responses = sanitizeResponses(schema, rawResponses);
  validateResponses(schema, responses);
  const scalars = deriveLegacyScalars(schema, responses);

  // .select().maybeSingle() is required here, not just to read the row
  // back, but because without it Supabase reports no error at all when
  // the id/event_id/host_id combination matches zero rows (e.g. the RSVP
  // was deleted in the moment between opening the edit dialog and saving,
  // or eventId/rsvpId belong to different hosts) — silently "succeeding"
  // at nothing instead of surfacing that the row is gone or not this
  // host's to edit.
  const { data, error } = await supabase
    .from("rsvps")
    .update({ responses, ...scalars })
    .eq("id", rsvpId)
    .eq("event_id", eventId)
    .eq("host_id", host.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("This RSVP no longer exists — it may have been deleted.");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function updateFormSchema(eventId: string, rawSchema: FormSchema) {
  const host = await requireHost();

  // Never trust a role-tagged field's type/options from the request as-is —
  // force them back to the canonical shape for that role (e.g. role
  // "attending" is always a yes/no radio), so a crafted or buggy client
  // can't silently break stats/derivation that assume the role is
  // trustworthy (see deriveLegacyScalars).
  const schema: FormSchema = { fields: rawSchema.fields.map(enforceRoleLock) };

  const roles = schema.fields.map((f) => f.role).filter((r): r is "name" | "attending" | "plus_ones" => r !== null);
  if (new Set(roles).size !== roles.length) {
    throw new Error("Only one field can be tagged for each of name/attending/plus-ones.");
  }
  const ids = schema.fields.map((f) => f.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Field ids must be unique.");
  }
  for (const field of schema.fields) {
    if (!field.label.trim()) {
      throw new Error("Every field needs a label.");
    }
    if (
      (field.type === "select" || field.type === "radio" || field.type === "checkbox") &&
      (!field.options || field.options.length === 0)
    ) {
      throw new Error(`"${field.label}" needs at least one option.`);
    }
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ form_schema: schema })
    .eq("id", eventId)
    .eq("host_id", host.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Event not found.");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

async function loadEventAndEmailableInvite(
  supabase: ReturnType<typeof createServiceRoleClient>,
  eventId: string,
  inviteId: string,
  hostId: string
) {
  const [{ data: event }, { data: invite }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).eq("host_id", hostId).maybeSingle(),
    supabase
      .from("invites")
      .select("id, name, email")
      .eq("id", inviteId)
      .eq("event_id", eventId)
      .eq("host_id", hostId)
      .maybeSingle(),
  ]);

  if (!event) {
    throw new Error("Event not found.");
  }
  if (!invite) {
    throw new Error("Invite not found.");
  }
  if (!invite.email) {
    throw new Error(`${invite.name} doesn't have an email address on file.`);
  }

  return { event: event as EventRecord, invite: invite as { id: string; name: string; email: string } };
}

export async function sendInviteEmail(eventId: string, inviteId: string) {
  const host = await requireHost();
  const supabase = createServiceRoleClient();

  const { event, invite } = await loadEventAndEmailableInvite(supabase, eventId, inviteId, host.id);

  try {
    await sendInviteEmailViaResend(event, invite);
  } catch (err) {
    await supabase.from("email_sends").insert({
      invite_id: invite.id,
      kind: "invite",
      status: err instanceof Error ? `failed: ${err.message}`.slice(0, 200) : "failed",
    });
    throw err;
  }

  const { error } = await supabase
    .from("email_sends")
    .insert({ invite_id: invite.id, kind: "invite", status: "sent" });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function sendReminderEmails(eventId: string) {
  const host = await requireHost();
  const supabase = createServiceRoleClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();
  if (!event) {
    throw new Error("Event not found.");
  }

  const { data: rsvps } = await supabase.from("rsvps").select("invite_id").eq("event_id", eventId);
  const respondedInviteIds = new Set((rsvps ?? []).map((r) => r.invite_id).filter(Boolean));

  const { data: invites, error: invitesError } = await supabase
    .from("invites")
    .select("id, name, email")
    .eq("event_id", eventId)
    .eq("host_id", host.id)
    .not("email", "is", null);
  if (invitesError) {
    throw new Error(invitesError.message);
  }

  const pending = (invites ?? []).filter((inv) => !respondedInviteIds.has(inv.id));

  let sent = 0;
  for (const invite of pending) {
    try {
      await sendReminderEmail(event as EventRecord, invite as { id: string; name: string; email: string });
      await supabase
        .from("email_sends")
        .insert({ invite_id: invite.id, kind: "reminder", status: "sent" });
      sent += 1;
    } catch (err) {
      await supabase.from("email_sends").insert({
        invite_id: invite.id,
        kind: "reminder",
        status: err instanceof Error ? `failed: ${err.message}`.slice(0, 200) : "failed",
      });
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return { sent, total: pending.length };
}

export async function updatePageSchema(eventId: string, schema: PageSchema) {
  const host = await requireHost();

  const supabase = createServiceRoleClient();
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();
  if (!event) {
    throw new Error("Event not found.");
  }

  const { error } = await supabase
    .from("events")
    .update({ page_schema: schema })
    .eq("id", eventId)
    .eq("host_id", host.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/events/${eventId}/design`);
  revalidatePath(`/e/${event.slug}`);
}
