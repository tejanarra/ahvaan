"use server";

import { getEventFull } from "@/lib/data/events";
import { getInviteForRsvpSubmissionPublic } from "@/lib/data/invites";
import { upsertRsvpPublic } from "@/lib/data/rsvps";
import { resolveFormSchema, findFieldByRole, deriveLegacyScalars } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";
import { buildResponsesFromFormData, validateResponses, assertResponsesWithinSizeBudget } from "@/lib/schemas/responses";

export type RsvpFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: {
    responses: Responses;
  };
};

export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const inviteId = String(formData.get("inviteId") ?? "").trim();

  // The invite id is the actual access control — the UI only shows the RSVP
  // form when one is present, but this is what makes that real rather than
  // just cosmetic. No valid invite for this exact event, no saved RSVP.
  // host_id comes from the invite row itself (denormalized at invite-creation
  // time), not trusted from the client, so the RSVP always lands under the
  // correct host regardless of what the form submits. eventId here is
  // whatever the host owns the invite under — not scoped by host_id since
  // this is the public submission path.
  const invite = await getInviteForRsvpSubmissionPublic(eventId, inviteId);
  const event = invite ? await getEventFull(invite.host_id, eventId) : null;

  if (!invite || !event) {
    return {
      status: "error",
      message: "This RSVP link is invalid or has expired.",
    };
  }

  const schema = resolveFormSchema(event.form_schema);
  const responses = buildResponsesFromFormData(schema, formData);

  // Preserve the existing UX rule (previously hardcoded): don't save
  // plus-ones when the guest isn't attending. Role-based, so it still
  // applies even if the host relabeled these fields.
  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");
  if (attendingField && plusOnesField && responses[attendingField.id] === "no") {
    responses[plusOnesField.id] = [];
  }

  try {
    assertResponsesWithinSizeBudget(responses);
    validateResponses(schema, responses);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  const scalars = deriveLegacyScalars(schema, responses);

  try {
    await upsertRsvpPublic({
      eventId,
      hostId: invite.host_id,
      inviteId: invite.id,
      responses,
      scalars,
    });
  } catch (err) {
    console.error("Failed to save RSVP", err);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  return {
    status: "success",
    data: { responses },
  };
}
