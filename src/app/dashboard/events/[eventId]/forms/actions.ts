"use server";

import { requireHost } from "@/lib/supabase/auth-server";
import * as formsData from "@/lib/data/forms";
import { deleteSubmission } from "@/lib/data/form-submissions";
import { parseCustomFormSchema } from "@/lib/schemas/custom-form-schema";
import type { CustomFormSchema } from "@/lib/forms/types";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";

export async function createFormAction(eventId: string, name: string) {
  const host = await requireHost();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Form name is required.");
  return formsData.createForm(host.id, eventId, trimmed);
}

export async function renameFormAction(eventId: string, formId: string, name: string) {
  const host = await requireHost();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Form name is required.");
  await formsData.renameForm(host.id, eventId, formId, trimmed);
}

export async function deleteFormAction(eventId: string, formId: string) {
  const host = await requireHost();
  await formsData.deleteForm(host.id, eventId, formId);
}

// Structural validation happens here (server-side, trust boundary), not
// just in the client builder — the same rule page-schema/form-schema
// updates follow: never trust a client-submitted schema as-is.
export async function updateCustomFormSchemaAction(eventId: string, formId: string, rawSchema: CustomFormSchema) {
  const host = await requireHost();

  const ids = rawSchema.fields.map((f) => f.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Field ids must be unique.");
  }
  for (const field of rawSchema.fields) {
    if (!field.label.trim()) {
      throw new Error("Every field needs a label.");
    }
    if ("options" in field && (!field.options || field.options.length === 0)) {
      throw new Error(`"${field.label}" needs at least one option.`);
    }
  }

  const schema = parseCustomFormSchema(rawSchema);
  await formsData.updateFormSchema(host.id, eventId, formId, schema);
}

export async function updateFormActionsAction(eventId: string, formId: string, actions: PostSubmitAction) {
  const host = await requireHost();
  await formsData.updateFormActions(host.id, eventId, formId, actions);
}

export async function deleteSubmissionAction(formId: string, submissionId: string) {
  const host = await requireHost();
  await deleteSubmission(host.id, formId, submissionId);
}
