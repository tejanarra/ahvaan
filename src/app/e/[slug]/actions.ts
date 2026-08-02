"use server";

import { submitRsvpFromFormData } from "@/lib/rsvp-submit";
import { submitCustomFormFromFormData } from "@/lib/form-submit";
import type { Responses } from "@/lib/schemas/form-schema";
import type { FormResponses } from "@/lib/forms/types";

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

export type CustomFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: {
    responses: FormResponses;
  };
};

export async function submitCustomForm(
  _prevState: CustomFormState,
  formData: FormData
): Promise<CustomFormState> {
  const result = await submitCustomFormFromFormData(formData);
  if (result.status === "error") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  return { status: "success", data: { responses: result.responses } };
}
