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
  const { error } = await supabase.from("wedding_rsvps").insert({
    name,
    attending,
    additional_guests: attending ? additionalGuests : [],
  });

  if (error) {
    console.error("Failed to save RSVP", error);
    return {
      status: "error",
      message: "Something went wrong saving your RSVP. Please try again.",
    };
  }

  return { status: "success" };
}
