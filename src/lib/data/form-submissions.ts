import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";
import type { FormResponses } from "@/lib/forms/types";

export type FormSubmissionRecord = {
  id: string;
  form_id: string;
  host_id: string;
  event_id: string;
  invite_id: string | null;
  email: string | null;
  responses: FormResponses;
  submitted_at: string;
};

const COLUMNS = "id, form_id, host_id, event_id, invite_id, email, responses, submitted_at";

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
//
// Branches on which identity the form's submission mode supplies:
// `inviteId` (private) upserts onto the partial unique index on
// (form_id, invite_id); `email` (email_verified) upserts onto
// (form_id, email); neither (anonymous) is a plain insert — every
// submission is its own row, no dedup. Exactly one of inviteId/email is
// ever passed by a caller (see src/lib/form-submit.ts's mode branch).
export async function upsertSubmissionPublic(input: {
  formId: string;
  hostId: string;
  eventId: string;
  inviteId?: string | null;
  email?: string | null;
  responses: FormResponses;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const row = {
    form_id: input.formId,
    host_id: input.hostId,
    event_id: input.eventId,
    invite_id: input.inviteId ?? null,
    email: input.email ?? null,
    responses: input.responses,
  };

  if (input.inviteId) {
    const { error } = await supabase.from("form_submissions").upsert(row, { onConflict: "form_id,invite_id" });
    if (error) throw new DataError(error.message);
    return;
  }
  if (input.email) {
    const { error } = await supabase.from("form_submissions").upsert(row, { onConflict: "form_id,email" });
    if (error) throw new DataError(error.message);
    return;
  }
  const { error } = await supabase.from("form_submissions").insert(row);
  if (error) throw new DataError(error.message);
}

// Prefill-on-return for 'private' mode — mirrors getRsvpForInvitePublic's
// role. No email-mode equivalent: that mode's "retrieve my answers" flow
// is an explicit guest action (see getSubmissionForEmailPublic), not an
// automatic page-load lookup, since there's no session tying a browser to
// an email the way an invite link ties it to an invite id.
export async function getSubmissionForInvitePublic(formId: string, inviteId: string): Promise<FormSubmissionRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select(COLUMNS)
    .eq("form_id", formId)
    .eq("invite_id", inviteId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as FormSubmissionRecord | null;
}

// Guest-facing "already responded? retrieve it" lookup for email_verified
// mode (src/app/events/[slug]/custom-form.tsx) — deliberately requires an
// explicit guest action (entering their email) rather than running
// automatically, and the caller rate-limits it (src/lib/form-submit.ts's
// isThrottled) since this is the one place a public endpoint accepts an
// arbitrary email and reports whether it matches something.
export async function getSubmissionForEmailPublic(formId: string, email: string): Promise<FormSubmissionRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select(COLUMNS)
    .eq("form_id", formId)
    .eq("email", email)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data as FormSubmissionRecord | null;
}

// One query per public page render (not one per "form" block instance) —
// every 'private'-mode prior submission this invite has across every form
// on the event, keyed by form_id, threaded into
// PageRenderContext.customFormResponses. Mirrors how customComponents/
// customForms are each a single batched query rather than N.
export async function listSubmissionsForInvitePublic(eventId: string, inviteId: string): Promise<Record<string, FormResponses>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("form_id, responses")
    .eq("event_id", eventId)
    .eq("invite_id", inviteId);
  if (error) throw new DataError(error.message);
  return Object.fromEntries(((data ?? []) as { form_id: string; responses: FormResponses }[]).map((r) => [r.form_id, r.responses]));
}

// Same batched, once-per-page-render shape as listSubmissionsForInvitePublic
// above, but keyed by a verified email instead of an invite id — the
// prefill-on-return path for a no-invite guest who's passed the page-level
// email verification gate (src/lib/guest-session.ts's cookie), used by
// page.tsx alongside the invite path.
export async function listSubmissionsForEmailPublic(eventId: string, email: string): Promise<Record<string, FormResponses>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("form_id, responses")
    .eq("event_id", eventId)
    .eq("email", email);
  if (error) throw new DataError(error.message);
  return Object.fromEntries(((data ?? []) as { form_id: string; responses: FormResponses }[]).map((r) => [r.form_id, r.responses]));
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
