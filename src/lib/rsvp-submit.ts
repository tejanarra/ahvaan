import { getEventFull, getEventByIdPublic } from "@/lib/data/events";
import { getInviteForRsvpSubmissionPublic } from "@/lib/data/invites";
import { upsertRsvpPublic, getRsvpForEmailPublic } from "@/lib/data/rsvps";
import { resolveFormSchema, findFieldByRole, deriveLegacyScalars } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";
import { buildResponsesFromFormData, validateResponses, assertResponsesWithinSizeBudget } from "@/lib/schemas/responses";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { createVerificationCode, verifyCode, peekVerification } from "@/lib/data/email-verification";
import { deliverVerificationEmail } from "@/lib/email";
import { buildVerifyLink } from "@/lib/verify-link";
import { getVerifiedGuestEmail } from "@/lib/guest-session";

const MIN_MS_BETWEEN_SUBMISSIONS = 2000;
// Cross-instance backstop behind the per-instance floor above (docs/02
// W9) — generous enough not to interfere with a guest legitimately
// changing their RSVP a few times.
const MAX_SUBMISSIONS_PER_WINDOW = 20;
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

export type RsvpSubmitResult =
  | { status: "success"; responses: Responses }
  | { status: "verification_sent"; verificationId: string; email: string }
  | { status: "error"; message: string };

// Carried inside the OTP row's `payload` column (see
// src/lib/data/email-verification.ts) so verifyRsvpEmailCode can finish the
// write without the guest re-entering their answers after checking email.
// Deliberately no `scalars` here — verifyRsvpEmailCode re-derives them from
// the schema at redemption time rather than trusting a value computed
// against whatever the schema looked like when the code was requested (see
// that function's own comment).
type PendingRsvpPayload = {
  eventId: string;
  hostId: string;
  email: string;
  responses: Responses;
};

// Shared by the server action (src/app/events/[slug]/actions.ts, used by
// the real guest page) and the public API route (src/app/api/rsvp/route.ts,
// used by a plain HTML <form> a host embeds in a sandboxed custom-code
// block) — both are guest-facing write paths for the exact same operation,
// so they share one validated implementation rather than drifting apart.
export async function submitRsvpFromFormData(formData: FormData): Promise<RsvpSubmitResult> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const rawInviteId = String(formData.get("inviteId") ?? "").trim();

  // Resolve the event + its host_id — via the invite when one's present
  // (host_id comes from the invite row, never the client), via a
  // direct-by-id lookup otherwise. A malformed (non-UUID) eventId/inviteId
  // — reachable from a hand-edited URL, or this route's own public POST
  // body — throws at the Postgres level rather than returning "no rows,"
  // so it's caught here and treated the same as "not found."
  let invite: Awaited<ReturnType<typeof getInviteForRsvpSubmissionPublic>> = null;
  let event: Awaited<ReturnType<typeof getEventFull>> = null;

  if (rawInviteId) {
    try {
      invite = await getInviteForRsvpSubmissionPublic(eventId, rawInviteId);
    } catch {
      invite = null;
    }
    event = invite ? await getEventFull(invite.host_id, eventId) : null;
  } else {
    event = await getEventByIdPublic(eventId).catch(() => null);
  }

  if (!event) {
    return { status: "error", message: "This RSVP link is invalid or has expired." };
  }

  const mode = parseSubmissionMode(event.submission_mode);

  // 'private' is the only mode that requires a valid invite — re-checked
  // here (not just gated client-side by the rsvp-form block's Render) since
  // a request can always reach this function directly.
  if (mode === "private" && !invite) {
    return { status: "error", message: "This RSVP link is invalid or has expired." };
  }

  // Resolved once, up front, so the throttle key, the validation relaxation
  // below, and the submit branch further down all agree on the same value.
  const cookieEmail = mode === "email_verified" && !invite ? await getVerifiedGuestEmail(eventId) : null;

  // Keyed by guest identity, not by event/form — an event-wide key would
  // throttle every guest against every other guest submitting around the
  // same time (a realistic scenario right after an invite blast), letting
  // one guest's submission silently block a different guest's for up to
  // MIN_MS_BETWEEN_SUBMISSIONS. Falls back to a best-effort client IP only
  // for a true first-time 'anonymous'-mode guest, who has no other stable
  // identity yet.
  const throttleKey = invite
    ? `rsvp:${invite.id}`
    : cookieEmail
      ? `rsvp-email:${eventId}:${cookieEmail}`
      : `rsvp-ip:${eventId}:${await getClientIp()}`;
  if (
    await isRateLimited(throttleKey, {
      minIntervalMs: MIN_MS_BETWEEN_SUBMISSIONS,
      maxHits: MAX_SUBMISSIONS_PER_WINDOW,
      windowMs: SUBMISSION_WINDOW_MS,
    })
  ) {
    return { status: "error", message: "Please wait a moment before submitting again." };
  }

  if (event.rsvp_deadline && Date.now() > new Date(event.rsvp_deadline).getTime()) {
    return { status: "error", message: "The RSVP deadline for this event has passed." };
  }

  const schema = resolveFormSchema(event.form_schema);
  const responses = buildResponsesFromFormData(schema, formData);

  // Preserve the existing UX rule: don't save plus-ones when the guest
  // isn't attending. Role-based, so it still applies even if the host
  // relabeled these fields.
  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");
  if (attendingField && plusOnesField && responses[attendingField.id] === "no") {
    responses[plusOnesField.id] = [];
  }

  const identityKnown = Boolean(invite) || Boolean(cookieEmail);

  // The email-role field is hidden from the guest-facing RSVP form
  // whenever identity is already established (rsvp-form.tsx's field
  // filter) — the server must relax its required-ness to match, or a host
  // marking it required would make every invited/already-verified guest's
  // RSVP fail validation on a field they were never shown.
  const emailField = findFieldByRole(schema, "email");
  const schemaForValidation =
    identityKnown && emailField
      ? { fields: schema.fields.map((f) => (f.id === emailField.id ? { ...f, required: false } : f)) }
      : schema;

  try {
    assertResponsesWithinSizeBudget(responses);
    validateResponses(schemaForValidation, responses);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  const scalars = deriveLegacyScalars(schema, responses, invite?.name);

  // A personal invite link already proves the host knows/trusts this
  // guest's identity — 'email_verified' mode only needs to independently
  // verify email ownership for a guest who showed up *without* one. An
  // invited guest is treated exactly like 'private' mode: no OTP, dedup by
  // invite_id, their link keeps working forever.
  if (mode === "email_verified" && !invite) {
    // The common case: this guest already passed the page-level "verify
    // your email once" gate (src/app/events/[slug]/email-verification-modal.tsx)
    // before ever seeing this form, so a verified-guest cookie is already
    // set — treat it exactly like an invite (bypass OTP entirely, upsert
    // keyed by that email). Falls through to the OTP-with-payload flow
    // below only as a defensive fallback (cookie expired mid-session, or
    // this request came from the no-JS embedded-HTML-form API route,
    // which has no page-level gate to go through first).
    if (cookieEmail) {
      try {
        await upsertRsvpPublic({
          eventId,
          hostId: event.host_id,
          inviteId: null,
          email: cookieEmail,
          responses,
          scalars,
        });
      } catch (err) {
        console.error("Failed to save RSVP", err);
        return { status: "error", message: "Something went wrong saving your RSVP. Please try again." };
      }
      return { status: "success", responses };
    }

    const rawEmail = emailField ? responses[emailField.id] : undefined;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email) {
      return { status: "error", message: "An email address is required." };
    }

    const payload: PendingRsvpPayload = { eventId, hostId: event.host_id, email, responses };
    const { id, code } = await createVerificationCode({
      subjectType: "rsvp",
      subjectId: eventId,
      purpose: "submit",
      email,
      payload,
    });

    try {
      await deliverVerificationEmail(email, buildVerifyLink(event.slug, "rsvp", id, code), code, event.title, {
        id: event.id,
        host_id: event.host_id,
      });
    } catch (err) {
      console.error("Failed to send RSVP verification email", err);
      return { status: "error", message: "Couldn't send a verification code. Please try again." };
    }

    return { status: "verification_sent", verificationId: id, email };
  }

  try {
    await upsertRsvpPublic({
      eventId,
      hostId: invite ? invite.host_id : event.host_id,
      inviteId: invite?.id ?? null,
      email: null,
      responses,
      scalars,
    });
  } catch (err) {
    console.error("Failed to save RSVP", err);
    return { status: "error", message: "Something went wrong saving your RSVP. Please try again." };
  }

  return { status: "success", responses };
}

// Finishes an email_verified RSVP submission once the guest's code is
// confirmed (by typing it, or via the magic-link route consuming it) — the
// actual write happens here, not in the initial submit call, so nothing is
// saved under a guest-typed email until they've proven they received mail
// sent to it.
export async function verifyRsvpEmailCode(verificationId: string, rawCode: string): Promise<RsvpSubmitResult> {
  const result = await verifyCode("rsvp", "submit", verificationId, rawCode);
  if (result.status === "expired") {
    return { status: "error", message: "That code has expired. Please request a new one." };
  }
  if (result.status === "too_many_attempts") {
    return { status: "error", message: "Too many incorrect attempts. Please request a new code." };
  }
  if (result.status === "invalid") {
    return { status: "error", message: "That code isn't right. Please try again." };
  }

  const payload = result.payload as PendingRsvpPayload;

  // The OTP's 10-minute TTL is enough time for a host to edit the RSVP
  // schema (or switch the event out of 'email_verified' mode, or unpublish
  // it) between when this guest first submitted and when they typed the
  // code — re-resolve the event/schema fresh and re-validate against it
  // rather than trusting the payload captured at request time, or a stale
  // payload could write responses keyed by field ids that no longer exist,
  // or bypass a mode a host has since locked down to 'private'.
  const event = await getEventByIdPublic(payload.eventId).catch(() => null);
  if (!event || parseSubmissionMode(event.submission_mode) !== "email_verified") {
    return { status: "error", message: "This event's RSVP settings changed before your code was confirmed. Please start over." };
  }

  const schema = resolveFormSchema(event.form_schema);
  const emailField = findFieldByRole(schema, "email");
  const schemaForValidation = emailField
    ? { fields: schema.fields.map((f) => (f.id === emailField.id ? { ...f, required: false } : f)) }
    : schema;

  try {
    assertResponsesWithinSizeBudget(payload.responses);
    validateResponses(schemaForValidation, payload.responses);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Invalid submission." };
  }

  const scalars = deriveLegacyScalars(schema, payload.responses);

  try {
    await upsertRsvpPublic({
      eventId: payload.eventId,
      hostId: payload.hostId,
      inviteId: null,
      email: payload.email,
      responses: payload.responses,
      scalars,
    });
  } catch (err) {
    console.error("Failed to save RSVP after verification", err);
    return { status: "error", message: "Something went wrong saving your RSVP. Please try again." };
  }

  return { status: "success", responses: payload.responses };
}

function reconstructRsvpResponses(
  schema: ReturnType<typeof resolveFormSchema>,
  rsvp: { name: string; attending: boolean; additional_guests: string[]; responses: Responses }
): Responses {
  const responses: Responses = { ...rsvp.responses };
  for (const field of schema.fields) {
    if (responses[field.id] !== undefined) continue;
    if (field.role === "name") responses[field.id] = rsvp.name;
    else if (field.role === "attending") responses[field.id] = rsvp.attending ? "yes" : "no";
    else if (field.role === "plus_ones") responses[field.id] = rsvp.additional_guests;
  }
  return responses;
}

// Used by page.tsx after a guest is redirected back from the magic link
// with `?verified=<id>` — re-derives the now-saved RSVP the same way a
// direct invite link's prefill works, so a landing-on-a-fresh-page-load
// guest sees their confirmed answers immediately (SSR), not just the tab
// that originally requested the code (that one updates via
// BroadcastChannel — see rsvp-form.tsx). Returns null for anything that
// doesn't check out (wrong event, never actually consumed, no matching
// row) rather than throwing — an invalid/stale `verified` param should
// just fall back to a normal fresh page, not error.
export async function getVerifiedRsvpResponses(
  schema: ReturnType<typeof resolveFormSchema>,
  eventId: string,
  verificationId: string
): Promise<Responses | null> {
  const info = await peekVerification("rsvp", verificationId).catch(() => null);
  if (!info || !info.consumed || info.subjectId !== eventId) return null;

  const rsvp = await getRsvpForEmailPublic(eventId, info.email).catch(() => null);
  if (!rsvp) return null;

  return reconstructRsvpResponses(schema, rsvp);
}

// Used by page.tsx to prefill RSVP for a guest who's already passed the
// page-level email verification gate (a verified-guest cookie, not a
// one-shot verification id) — same reconstruction as
// getVerifiedRsvpResponses above, just keyed by an already-trusted email
// instead of a just-consumed verification row.
export async function getResponsesForEmail(
  schema: ReturnType<typeof resolveFormSchema>,
  eventId: string,
  email: string
): Promise<Responses | null> {
  const rsvp = await getRsvpForEmailPublic(eventId, email).catch(() => null);
  if (!rsvp) return null;
  return reconstructRsvpResponses(schema, rsvp);
}
