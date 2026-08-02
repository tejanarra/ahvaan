import { getFormPublic } from "@/lib/data/forms";
import { insertSubmissionPublic } from "@/lib/data/form-submissions";
import { buildCustomFormResponsesFromFormData, validateCustomFormResponses, firstValidationError } from "@/lib/forms/validate-submission";
import { assertWithinSizeBudget } from "@/lib/schemas/size-budget";
import { isThrottled } from "@/lib/rate-limit";
import type { FormResponses } from "@/lib/forms/types";

const MIN_MS_BETWEEN_SUBMISSIONS = 2000;

export type FormSubmitResult =
  | { status: "success"; responses: FormResponses; formId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

// Shared by the server action (src/app/e/[slug]/actions.ts) and the public
// API route (src/app/api/forms/[formId]/route.ts, for a plain HTML <form>
// embedded in a sandboxed custom-code block) — same two-path split as
// src/lib/rsvp-submit.ts, same reason (Server Actions can't be posted to
// from an opaque-origin sandboxed iframe).
export async function submitCustomFormFromFormData(formData: FormData): Promise<FormSubmitResult> {
  const formId = String(formData.get("formId") ?? "").trim();

  let form: Awaited<ReturnType<typeof getFormPublic>> = null;
  try {
    form = await getFormPublic(formId);
  } catch {
    form = null;
  }
  if (!form) {
    return { status: "error", message: "This form is no longer available." };
  }

  if (isThrottled(`form:${form.id}`, MIN_MS_BETWEEN_SUBMISSIONS)) {
    return { status: "error", message: "Please wait a moment before submitting again." };
  }

  const responses = buildCustomFormResponsesFromFormData(form.schema, formData);

  try {
    assertWithinSizeBudget(responses, "This submission");
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  const fieldErrors = validateCustomFormResponses(form.schema, responses);
  const firstError = firstValidationError(fieldErrors);
  if (firstError) {
    return { status: "error", message: firstError, fieldErrors };
  }

  try {
    // host_id/event_id come from the `forms` row itself (loaded server-side
    // above), never trusted from client input — same model as
    // rsvp-submit.ts taking host_id from the invite row.
    await insertSubmissionPublic({ formId: form.id, hostId: form.host_id, eventId: form.event_id, responses });
  } catch (err) {
    console.error("Failed to save form submission", err);
    return { status: "error", message: "Something went wrong saving your response. Please try again." };
  }

  return { status: "success", responses, formId: form.id };
}
