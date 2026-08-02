import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";
import type { FormResponses } from "@/lib/forms/types";

export type FormSubmissionRecord = {
  id: string;
  form_id: string;
  host_id: string;
  event_id: string;
  responses: FormResponses;
  submitted_at: string;
};

const COLUMNS = "id, form_id, host_id, event_id, responses, submitted_at";

export async function listSubmissions(hostId: string, formId: string): Promise<FormSubmissionRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select(COLUMNS)
    .eq("host_id", hostId)
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });
  if (error) throw new DataError(error.message);
  return (data ?? []) as FormSubmissionRecord[];
}

// Public write path (a guest submitting an embedded form). `hostId`/
// `eventId` are passed in already resolved from the `forms` row itself by
// the caller (src/lib/form-submit.ts) — never trusted from client input,
// exactly like rsvp-submit.ts takes host_id from the invite row.
export async function insertSubmissionPublic(input: {
  formId: string;
  hostId: string;
  eventId: string;
  responses: FormResponses;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("form_submissions").insert({
    form_id: input.formId,
    host_id: input.hostId,
    event_id: input.eventId,
    responses: input.responses,
  });
  if (error) throw new DataError(error.message);
}

export async function deleteSubmission(hostId: string, formId: string, submissionId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .eq("host_id", hostId)
    .eq("form_id", formId)
    .eq("id", submissionId);
  if (error) throw new DataError(error.message);
}
