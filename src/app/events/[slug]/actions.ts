"use server";

import { submitRsvpFromFormData } from "@/lib/rsvp-submit";
import { submitCustomFormFromFormData } from "@/lib/form-submit";
import { requestGuestVerification, verifyGuestVerification } from "@/lib/guest-verification";
import { clearVerifiedGuestCookie } from "@/lib/guest-session";
import type { Responses } from "@/lib/schemas/form-schema";
import type { FormResponses } from "@/lib/forms/types";

export type RsvpFormState = {
  status: "idle" | "success" | "error" | "verification_sent";
  message?: string;
  data?: {
    responses: Responses;
  };
  verification?: {
    verificationId: string;
    email: string;
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
  if (result.status === "verification_sent") {
    // Only reachable from a stale guest-session cookie mid-submit — see
    // rsvp-form.tsx's handling, which reacts by refreshing the page rather
    // than offering an inline code-entry step here.
    return { status: "verification_sent", verification: { verificationId: result.verificationId, email: result.email } };
  }
  return { status: "success", data: { responses: result.responses } };
}

export type CustomFormState = {
  status: "idle" | "success" | "error" | "verification_sent";
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: {
    responses: FormResponses;
  };
  verification?: {
    verificationId: string;
    email: string;
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
  if (result.status === "verification_sent") {
    // See the matching comment on submitRsvp above.
    return { status: "verification_sent", verification: { verificationId: result.verificationId, email: result.email } };
  }
  return { status: "success", data: { responses: result.responses } };
}

// The page-level "verify your email once for this event" gate
// (src/app/events/[slug]/email-verification-modal.tsx) — on success,
// verifyGuestVerificationAction sets a guest-session cookie
// (src/lib/guest-session.ts) that every RSVP/Forms block on the page then
// treats like an invite for identity purposes, so this is a Server Action
// (not a plain lib call) specifically because only a Server Action or
// Route Handler can mutate cookies.
export async function requestGuestVerificationAction(eventId: string, email: string) {
  return requestGuestVerification(eventId, email);
}

export async function verifyGuestVerificationAction(eventId: string, verificationId: string, code: string) {
  return verifyGuestVerification(eventId, verificationId, code);
}

// The "Submitted as x@y.com — Change?" footer (guest-identity-footer.tsx)
// — ends this browser's verified session for the event so the page-level
// gate reappears, letting the guest verify under a different address.
export async function clearGuestVerificationAction(eventId: string) {
  await clearVerifiedGuestCookie(eventId);
}
