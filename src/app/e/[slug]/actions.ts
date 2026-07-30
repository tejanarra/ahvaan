"use server";

import { submitRsvpFromFormData } from "@/lib/rsvp-submit";
import type { Responses } from "@/lib/schemas/form-schema";

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
  const result = await submitRsvpFromFormData(formData);
  if (result.status === "error") {
    return { status: "error", message: result.message };
  }
  return { status: "success", data: { responses: result.responses } };
}
