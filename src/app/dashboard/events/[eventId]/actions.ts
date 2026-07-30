"use server";

import { requireHost } from "@/lib/supabase/auth-server";
import { deliverInviteEmail, deliverReminderEmail } from "@/lib/email";
import { getEventFull, updateFormSchema as updateFormSchemaData, updatePageSchema as updatePageSchemaData } from "@/lib/data/events";
import * as invitesData from "@/lib/data/invites";
import * as rsvpsData from "@/lib/data/rsvps";
import { logEmailSend } from "@/lib/data/email-log";
import { NotFoundError } from "@/lib/data/errors";
import { resolveFormSchema, deriveLegacyScalars, enforceRoleLock } from "@/lib/schemas/form-schema";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";
import { sanitizeResponses, validateResponses, assertResponsesWithinSizeBudget } from "@/lib/schemas/responses";
import type { PageSchema } from "@/lib/blocks/types";

export async function createInvite(eventId: string, name: string, email?: string) {
  const host = await requireHost();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Guest name is required.");
  }

  return invitesData.createInvite(host.id, eventId, trimmed, email?.trim() || null);
}

export async function deleteInvite(eventId: string, inviteId: string) {
  const host = await requireHost();
  await invitesData.deleteInvite(host.id, eventId, inviteId);
}

export async function deleteRsvp(eventId: string, rsvpId: string) {
  const host = await requireHost();
  await rsvpsData.deleteRsvp(host.id, eventId, rsvpId);
}

export async function updateRsvp(eventId: string, rsvpId: string, rawResponses: Responses) {
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) throw new NotFoundError("Event not found.");

  const schema = resolveFormSchema(event.form_schema);
  const responses = sanitizeResponses(schema, rawResponses);
  assertResponsesWithinSizeBudget(responses);
  validateResponses(schema, responses);
  const scalars = deriveLegacyScalars(schema, responses);

  await rsvpsData.updateRsvp(host.id, eventId, rsvpId, responses, scalars);
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

  await updateFormSchemaData(host.id, eventId, schema);
}

export async function sendInviteEmailAction(eventId: string, inviteId: string) {
  const host = await requireHost();

  const [event, invite] = await Promise.all([
    getEventFull(host.id, eventId),
    invitesData.getEmailableInvite(host.id, eventId, inviteId),
  ]);
  if (!event) throw new NotFoundError("Event not found.");

  try {
    await deliverInviteEmail(event, invite);
  } catch (err) {
    await logEmailSend({
      hostId: host.id,
      eventId,
      inviteId: invite.id,
      kind: "invite",
      status: "failed",
      error: err instanceof Error ? err.message : undefined,
    });
    throw err;
  }

  await logEmailSend({ hostId: host.id, eventId, inviteId: invite.id, kind: "invite", status: "sent" });
}

export async function sendReminderEmails(eventId: string) {
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) throw new NotFoundError("Event not found.");

  const respondedInviteIds = await rsvpsData.listRespondedInviteIds(eventId);
  const pending = await invitesData.listPendingInvitesWithEmail(host.id, eventId, respondedInviteIds);

  let sent = 0;
  for (const invite of pending) {
    try {
      await deliverReminderEmail(event, invite);
      await logEmailSend({ hostId: host.id, eventId, inviteId: invite.id, kind: "reminder", status: "sent" });
      sent += 1;
    } catch (err) {
      await logEmailSend({
        hostId: host.id,
        eventId,
        inviteId: invite.id,
        kind: "reminder",
        status: "failed",
        error: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return { sent, total: pending.length };
}

export async function updatePageSchema(eventId: string, schema: PageSchema) {
  const host = await requireHost();
  await updatePageSchemaData(host.id, eventId, schema);
}
