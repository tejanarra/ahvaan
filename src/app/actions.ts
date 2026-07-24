"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export type RsvpFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: {
    name: string;
    attending: boolean;
    additionalGuests: string[];
  };
};

const MAX_NAME_LENGTH = 100;
const MAX_GUESTS = 15;

export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const inviteId = String(formData.get("inviteId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, MAX_NAME_LENGTH);
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
    .map((value) => String(value).trim().slice(0, MAX_NAME_LENGTH))
    .filter((value) => value.length > 0)
    .slice(0, MAX_GUESTS);

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

  const payload = {
    name,
    attending,
    additional_guests: attending ? additionalGuests : [],
    invite_id: invite.id,
  };

  // Upserting on the unique invite_id constraint (see supabase/schema.sql)
  // makes "resubmitting updates the existing row" atomic — a check-then-
  // insert/update pattern here would race under concurrent/duplicate
  // submissions and create two rows for the same invite.
  const { error } = await supabase
    .from("wedding_rsvps")
    .upsert(payload, { onConflict: "invite_id" });

  if (error) {
    console.error("Failed to save RSVP", error);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  return {
    status: "success",
    data: {
      name,
      attending,
      additionalGuests: payload.additional_guests,
    },
  };
}
