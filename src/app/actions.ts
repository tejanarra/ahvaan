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

  // Resubmitting under the same name updates their existing response instead
  // of creating a duplicate row (e.g. someone changing their mind, or
  // reopening their personalized invite link). If more than one existing row
  // matches (e.g. leftover duplicates), update the most recent one.
  const { data: existingRows, error: lookupError } = await supabase
    .from("wedding_rsvps")
    .select("id")
    .ilike("name", name)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lookupError) {
    console.error("Failed to look up existing RSVP", lookupError);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  const existing = existingRows?.[0];

  const payload = {
    name,
    attending,
    additional_guests: attending ? additionalGuests : [],
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
