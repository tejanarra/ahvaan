"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export type RsvpFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const inviteId = String(formData.get("inviteId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const attendingValue = String(formData.get("attending") ?? "");

  if (!name) {
    return { status: "error", message: "Please enter your name." };
  }
  if (attendingValue !== "yes" && attendingValue !== "no") {
    return { status: "error", message: "Please let us know if you can attend." };
  }

  const attending = attendingValue === "yes";

  const additionalGuests = formData
    .getAll("guestName")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  const supabase = createServiceRoleClient();

  // The invite id is the actual access control — the UI only shows the RSVP
  // form when one is present, but this is what makes that real rather than
  // just cosmetic. No valid invite, no saved RSVP.
  const { data: invite } = await supabase
    .from("invites")
    .select("id")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) {
    return {
      status: "error",
      message: "This RSVP link is invalid or has expired.",
    };
  }

  // Resubmitting through the same invite link updates that guest's existing
  // response instead of creating a duplicate row.
  const { data: existing, error: lookupError } = await supabase
    .from("wedding_rsvps")
    .select("id")
    .eq("invite_id", invite.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to look up existing RSVP", lookupError);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  const payload = {
    name,
    attending,
    additional_guests: attending ? additionalGuests : [],
    invite_id: invite.id,
  };

  const { error } = existing
    ? await supabase.from("wedding_rsvps").update(payload).eq("id", existing.id)
    : await supabase.from("wedding_rsvps").insert(payload);

  if (error) {
    console.error("Failed to save RSVP", error);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  return { status: "success" };
}
