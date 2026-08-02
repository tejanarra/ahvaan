import { getEventByIdPublic } from "@/lib/data/events";
import { createVerificationCode, verifyCode } from "@/lib/data/email-verification";
import { deliverVerificationEmail } from "@/lib/email";
import { buildVerifyLink } from "@/lib/verify-link";
import { setVerifiedGuestCookie } from "@/lib/guest-session";
import { isThrottled } from "@/lib/rate-limit";

const MIN_MS_BETWEEN_REQUESTS = 2000;

export type GuestVerificationResult =
  | { status: "verification_sent"; verificationId: string; email: string }
  | { status: "error"; message: string };

// Step 1 of the page-level "verify your email once for this event" gate
// (src/app/events/[slug]/email-verification-modal.tsx) — event-scoped, not
// RSVP- or Forms-specific, since one verification now covers every
// RSVP/Forms block on the page. Uses subjectType "rsvp" purely because the
// concept is "verified for this event" (eventId as subjectId), not
// per-form; no payload is carried since nothing has been submitted yet —
// this only proves email ownership before any form is shown.
export async function requestGuestVerification(eventId: string, rawEmail: string): Promise<GuestVerificationResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { status: "error", message: "An email address is required." };

  if (isThrottled(`guest-verify:${eventId}:${email}`, MIN_MS_BETWEEN_REQUESTS)) {
    return { status: "error", message: "Please wait a moment before trying again." };
  }

  const event = await getEventByIdPublic(eventId).catch(() => null);
  if (!event) return { status: "error", message: "This page is no longer available." };

  const { id, code } = await createVerificationCode({
    subjectType: "rsvp",
    subjectId: eventId,
    purpose: "identity",
    email,
  });

  try {
    await deliverVerificationEmail(email, buildVerifyLink(event.slug, "rsvp", id, code), code, event.title);
  } catch (err) {
    console.error("Failed to send guest verification email", err);
    return { status: "error", message: "Couldn't send a verification code. Please try again." };
  }

  return { status: "verification_sent", verificationId: id, email };
}

export type VerifyGuestResult = { status: "success"; email: string } | { status: "error"; message: string };

// Step 2 — called both by the manual code-entry fallback (a Server Action)
// and by the magic-link GET route (src/app/events/[slug]/verify/route.ts).
// On success, sets the guest-session cookie (src/lib/guest-session.ts) so
// every RSVP/Forms block on the page treats this browser as verified for
// this event from now on, without asking again.
export async function verifyGuestVerification(eventId: string, verificationId: string, rawCode: string): Promise<VerifyGuestResult> {
  // `eventId` comes straight from the client (the modal already has it as
  // a prop) — verifyCode's subject-id check makes sure it actually matches
  // this specific verification row before we ever set a cookie for it, so
  // a guest who legitimately verified for event A can't get a cookie for
  // event B by calling this action with A's still-valid verificationId/code
  // but B's eventId.
  const result = await verifyCode("rsvp", "identity", verificationId, rawCode, eventId);
  if (result.status === "expired") {
    return { status: "error", message: "That code has expired. Please request a new one." };
  }
  if (result.status === "too_many_attempts") {
    return { status: "error", message: "Too many incorrect attempts. Please request a new code." };
  }
  if (result.status === "invalid") {
    return { status: "error", message: "That code isn't right. Please try again." };
  }

  await setVerifiedGuestCookie(eventId, result.email);
  return { status: "success", email: result.email };
}
