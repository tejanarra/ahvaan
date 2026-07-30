import { getEventFull } from "@/lib/data/events";
import { getInviteForRsvpSubmissionPublic } from "@/lib/data/invites";
import { upsertRsvpPublic } from "@/lib/data/rsvps";
import { resolveFormSchema, findFieldByRole, deriveLegacyScalars } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";
import { buildResponsesFromFormData, validateResponses, assertResponsesWithinSizeBudget } from "@/lib/schemas/responses";

export type RsvpSubmitResult =
  | { status: "success"; responses: Responses }
  | { status: "error"; message: string };

// Shared by the server action (src/app/e/[slug]/actions.ts, used by the
// real guest page) and the public API route (src/app/api/rsvp/route.ts,
// used by a plain HTML <form> a host embeds in a sandboxed custom-code
// block) — both are guest-facing write paths for the exact same operation,
// so they share one validated implementation rather than drifting apart.
export async function submitRsvpFromFormData(formData: FormData): Promise<RsvpSubmitResult> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const inviteId = String(formData.get("inviteId") ?? "").trim();

  // The invite id is the actual access control — host_id comes from the
  // invite row itself (denormalized at invite-creation time), never
  // trusted from the client, so the RSVP always lands under the correct
  // host regardless of what the form submits. A malformed (non-UUID)
  // eventId/inviteId — reachable from a hand-edited URL, or now this
  // route's own public POST body — throws at the Postgres level rather
  // than returning "no rows," so it's caught here and treated the same as
  // "not found" instead of surfacing as an uncaught 500.
  let invite: Awaited<ReturnType<typeof getInviteForRsvpSubmissionPublic>> = null;
  try {
    invite = await getInviteForRsvpSubmissionPublic(eventId, inviteId);
  } catch {
    invite = null;
  }
  const event = invite ? await getEventFull(invite.host_id, eventId) : null;

  if (!invite || !event) {
    return { status: "error", message: "This RSVP link is invalid or has expired." };
  }

  const schema = resolveFormSchema(event.form_schema);
  const responses = buildResponsesFromFormData(schema, formData);

  // Preserve the existing UX rule: don't save plus-ones when the guest
  // isn't attending. Role-based, so it still applies even if the host
  // relabeled these fields.
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
    await upsertRsvpPublic({ eventId, hostId: invite.host_id, inviteId: invite.id, responses, scalars });
  } catch (err) {
    console.error("Failed to save RSVP", err);
    return { status: "error", message: "Something went wrong saving your RSVP. Please try again." };
  }

  return { status: "success", responses };
}
