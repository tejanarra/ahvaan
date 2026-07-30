"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveFormSchema, findFieldByRole, deriveLegacyScalars } from "@/lib/form-schema";
import type { Responses } from "@/lib/form-schema";
import { buildResponsesFromFormData, validateResponses } from "@/lib/rsvp-validation";

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

  const supabase = createServiceRoleClient();

  // The invite id is the actual access control — the UI only shows the RSVP
  // form when one is present, but this is what makes that real rather than
  // just cosmetic. No valid invite for this exact event, no saved RSVP.
  // host_id comes from the invite row itself (denormalized at invite-creation
  // time), not trusted from the client, so the RSVP always lands under the
  // correct host regardless of what the form submits.
  const [{ data: invite }, { data: event }] = await Promise.all([
    supabase.from("invites").select("id, host_id").eq("id", inviteId).eq("event_id", eventId).maybeSingle(),
    supabase.from("events").select("form_schema").eq("id", eventId).maybeSingle(),
  ]);

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
    validateResponses(schema, responses);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  const scalars = deriveLegacyScalars(schema, responses);

  const payload = {
    event_id: eventId,
    host_id: invite.host_id,
    invite_id: invite.id,
    responses,
    ...scalars,
  };

  // Upserting on the unique invite_id constraint (see supabase/schema-saas.sql)
  // makes "resubmitting updates the existing row" atomic — a check-then-
  // insert/update pattern here would race under concurrent/duplicate
  // submissions and create two rows for the same invite.
  const { error } = await supabase.from("rsvps").upsert(payload, { onConflict: "invite_id" });

  if (error) {
    console.error("Failed to save RSVP", error);
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
