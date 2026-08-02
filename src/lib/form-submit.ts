import { getFormPublic } from "@/lib/data/forms";
import { upsertSubmissionPublic, getSubmissionForEmailPublic } from "@/lib/data/form-submissions";
import { getInvitePublic } from "@/lib/data/invites";
import { getEventByIdPublic } from "@/lib/data/events";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
import { buildCustomFormResponsesFromFormData, validateCustomFormResponses, firstValidationError } from "@/lib/forms/validate-submission";
import { assertWithinSizeBudget } from "@/lib/schemas/size-budget";
import { isThrottled, getClientIp } from "@/lib/rate-limit";
import { createVerificationCode, verifyCode, peekVerification } from "@/lib/data/email-verification";
import { deliverVerificationEmail } from "@/lib/email";
import { buildVerifyLink } from "@/lib/verify-link";
import { getVerifiedGuestEmail } from "@/lib/guest-session";
import type { FormResponses, CustomFormSchema } from "@/lib/forms/types";

const MIN_MS_BETWEEN_SUBMISSIONS = 2000;

export type FormSubmitResult =
  | { status: "success"; responses: FormResponses; formId: string }
  | { status: "verification_sent"; verificationId: string; email: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

// Carried inside the OTP row's `payload` column so verifyFormSubmissionCode
// can finish the write without the guest re-entering their answers.
type PendingFormPayload = {
  formId: string;
  hostId: string;
  eventId: string;
  email: string;
  responses: FormResponses;
};

function findEmailFieldId(schema: CustomFormSchema): string | null {
  return schema.fields.find((f) => f.kind === "email")?.id ?? null;
}

// Shared by the server action (src/app/events/[slug]/actions.ts) and the
// public API route (src/app/api/forms/[formId]/route.ts, for a plain HTML
// <form> embedded in a sandboxed custom-code block) — same two-path split
// as src/lib/rsvp-submit.ts, same reason (Server Actions can't be posted
// to from an opaque-origin sandboxed iframe).
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

  // Who's allowed to submit is one event-wide setting (events.submission_
  // mode), not a per-form choice — every form on an event follows it.
  const event = await getEventByIdPublic(form.event_id).catch(() => null);
  if (!event) {
    return { status: "error", message: "This form is no longer available." };
  }
  const mode = parseSubmissionMode(event.submission_mode);

  // Identity check per the event's submission mode — mirrors the RSVP form
  // block's own client-side gate (only rendering the form at all when an
  // invite is present), but re-checked here too since a request can always
  // reach this function directly (the public API route), not just through
  // the guest-facing form.
  const rawInviteId = String(formData.get("inviteId") ?? "").trim();
  const invite = rawInviteId ? await getInvitePublic(form.event_id, rawInviteId).catch(() => null) : null;
  if (mode === "private" && !invite) {
    return { status: "error", message: "This form requires your personal invite link." };
  }

  // A personal invite link already proves the host knows/trusts this
  // guest's identity — see the matching comment in rsvp-submit.ts. An
  // invited guest is treated exactly like 'private' mode: no OTP, dedup by
  // invite_id. Resolved once, up front, so both the validation relaxation
  // below and the submit branch further down agree on the same value.
  const cookieEmail = mode === "email_verified" && !invite ? await getVerifiedGuestEmail(form.event_id) : null;
  const identityKnown = Boolean(invite) || Boolean(cookieEmail);

  // Keyed by guest identity, not by form — a per-form key would throttle
  // every guest against every other guest submitting the same form around
  // the same time (see the matching comment in rsvp-submit.ts). Falls back
  // to a best-effort client IP only for a true first-time
  // 'anonymous'-mode guest.
  const throttleKey = invite
    ? `form-invite:${form.id}:${invite.id}`
    : cookieEmail
      ? `form-email:${form.id}:${cookieEmail}`
      : `form-ip:${form.id}:${await getClientIp()}`;
  if (isThrottled(throttleKey, MIN_MS_BETWEEN_SUBMISSIONS)) {
    return { status: "error", message: "Please wait a moment before submitting again." };
  }

  const responses = buildCustomFormResponsesFromFormData(form.schema, formData);

  try {
    assertWithinSizeBudget(responses, "This submission");
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  // The identity email field is hidden from the guest-facing form whenever
  // identity is already established (custom-form.tsx's DynamicField
  // filter) — the server must relax its required-ness to match, or a host
  // marking it required would make every invited/already-verified guest's
  // submission fail validation on a field they were never shown. Only
  // required-ness is relaxed (via a validation-only schema clone); the
  // field's stored value is untouched.
  const identityEmailFieldId = findEmailFieldId(form.schema);
  const schemaForValidation =
    identityKnown && identityEmailFieldId
      ? { fields: form.schema.fields.map((f) => (f.id === identityEmailFieldId ? { ...f, required: false } : f)) }
      : form.schema;

  const fieldErrors = validateCustomFormResponses(schemaForValidation, responses);
  const firstError = firstValidationError(fieldErrors);
  if (firstError) {
    return { status: "error", message: firstError, fieldErrors };
  }

  if (mode === "email_verified" && !invite) {
    if (cookieEmail) {
      try {
        await upsertSubmissionPublic({
          formId: form.id,
          hostId: form.host_id,
          eventId: form.event_id,
          inviteId: null,
          email: cookieEmail,
          responses,
        });
      } catch (err) {
        console.error("Failed to save form submission", err);
        return { status: "error", message: "Something went wrong saving your response. Please try again." };
      }
      return { status: "success", responses, formId: form.id };
    }

    const rawEmail = identityEmailFieldId ? responses[identityEmailFieldId] : undefined;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email) {
      return { status: "error", message: "An email address is required." };
    }

    const payload: PendingFormPayload = {
      formId: form.id,
      hostId: form.host_id,
      eventId: form.event_id,
      email,
      responses,
    };
    const { id, code } = await createVerificationCode({
      subjectType: "form",
      subjectId: form.id,
      purpose: "submit",
      email,
      payload,
    });

    try {
      await deliverVerificationEmail(email, buildVerifyLink(event.slug, "form", id, code), code, form.name);
    } catch (err) {
      console.error("Failed to send form verification email", err);
      return { status: "error", message: "Couldn't send a verification code. Please try again." };
    }

    return { status: "verification_sent", verificationId: id, email };
  }

  try {
    // host_id/event_id come from the `forms` row itself (loaded server-side
    // above), never trusted from client input — same model as
    // rsvp-submit.ts taking host_id from the invite row.
    await upsertSubmissionPublic({
      formId: form.id,
      hostId: form.host_id,
      eventId: form.event_id,
      inviteId: invite?.id ?? null,
      email: null,
      responses,
    });
  } catch (err) {
    console.error("Failed to save form submission", err);
    return { status: "error", message: "Something went wrong saving your response. Please try again." };
  }

  return { status: "success", responses, formId: form.id };
}

// Finishes an email_verified form submission once the guest's code is
// confirmed (typed, or via the magic-link route) — mirrors
// verifyRsvpEmailCode.
export async function verifyFormSubmissionCode(verificationId: string, rawCode: string): Promise<FormSubmitResult> {
  const result = await verifyCode("form", "submit", verificationId, rawCode);
  if (result.status === "expired") {
    return { status: "error", message: "That code has expired. Please request a new one." };
  }
  if (result.status === "too_many_attempts") {
    return { status: "error", message: "Too many incorrect attempts. Please request a new code." };
  }
  if (result.status === "invalid") {
    return { status: "error", message: "That code isn't right. Please try again." };
  }

  const payload = result.payload as PendingFormPayload;

  // Same staleness guard as verifyRsvpEmailCode: the OTP's 10-minute TTL
  // is enough time for a host to edit the form's schema or switch the
  // event out of 'email_verified' mode between this guest's initial submit
  // and them typing the code — re-resolve both fresh and re-validate
  // rather than trusting the payload captured at request time.
  const [form, event] = await Promise.all([
    getFormPublic(payload.formId).catch(() => null),
    getEventByIdPublic(payload.eventId).catch(() => null),
  ]);
  if (!form || !event || parseSubmissionMode(event.submission_mode) !== "email_verified") {
    return { status: "error", message: "This form's settings changed before your code was confirmed. Please start over." };
  }

  const identityEmailFieldId = findEmailFieldId(form.schema);
  const schemaForValidation = identityEmailFieldId
    ? { fields: form.schema.fields.map((f) => (f.id === identityEmailFieldId ? { ...f, required: false } : f)) }
    : form.schema;

  try {
    assertWithinSizeBudget(payload.responses, "This submission");
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }
  const fieldErrors = validateCustomFormResponses(schemaForValidation, payload.responses);
  const firstError = firstValidationError(fieldErrors);
  if (firstError) {
    return { status: "error", message: firstError, fieldErrors };
  }

  try {
    await upsertSubmissionPublic({
      formId: payload.formId,
      hostId: payload.hostId,
      eventId: payload.eventId,
      inviteId: null,
      email: payload.email,
      responses: payload.responses,
    });
  } catch (err) {
    console.error("Failed to save form submission after verification", err);
    return { status: "error", message: "Something went wrong saving your response. Please try again." };
  }

  return { status: "success", responses: payload.responses, formId: payload.formId };
}

// Used by page.tsx after a guest is redirected back from the magic link
// with `?verified=<id>&vtype=form&vform=<formId>` — see the matching
// comment on getVerifiedRsvpResponses in rsvp-submit.ts for why this
// exists (SSR path for a fresh page load; the tab that requested the code
// updates via BroadcastChannel instead).
export async function getVerifiedFormResponses(formId: string, verificationId: string): Promise<FormResponses | null> {
  const info = await peekVerification("form", verificationId).catch(() => null);
  if (!info || !info.consumed || info.subjectId !== formId) return null;

  const submission = await getSubmissionForEmailPublic(formId, info.email).catch(() => null);
  return submission?.responses ?? null;
}
