import { signLinkToken, verifyLinkToken } from "@/lib/signed-link-token";

// One-year expiry — an unsubscribe link is embedded in every invite/
// reminder/verification email and must still work whenever a guest
// eventually opens that email, not just shortly after it's sent.
const UNSUBSCRIBE_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;
// Short-lived — a resubscribe-confirmation link is sent fresh in response
// to a just-submitted form, so there's no reason for it to remain valid
// for long; short expiry limits the window a leaked/forwarded link is
// useful for.
const RESUBSCRIBE_TOKEN_TTL_MS = 60 * 60 * 1000;

type UnsubscribeTokenPayload = { purpose: "unsubscribe"; eventId: string; hostId: string; email: string; exp: number };
type ResubscribeTokenPayload = { purpose: "resubscribe"; email: string; exp: number };

// Embedded in every invite/reminder/verification email's unsubscribe link
// (src/lib/email.ts) — scoped to one event (see the host_id-invariant
// comment on the email_unsubscribes table in supabase/schema-saas.sql: an
// unsubscribe applies to that event only, not every event the same
// address happens to be invited to). No login/session required to use it
// on purpose — "click this link, you're unsubscribed" is the whole point.
export function signUnsubscribeToken(eventId: string, hostId: string, email: string): string {
  return signLinkToken({ purpose: "unsubscribe", eventId, hostId, email, exp: Date.now() + UNSUBSCRIBE_TOKEN_TTL_MS });
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  const payload = verifyLinkToken<UnsubscribeTokenPayload>(token);
  return payload?.purpose === "unsubscribe" ? payload : null;
}

// The resubscribe self-service form (src/app/resubscribe) never trusts a
// typed email directly — it emails a confirmation link carrying this token
// instead (double opt-in), so resubscribing requires proving control of
// the inbox being resubscribed, not just typing an address into a public
// form. Global (no eventId) since the form doesn't know which event(s) an
// address is unsubscribed from — clicking it clears every one.
export function signResubscribeToken(email: string): string {
  return signLinkToken({ purpose: "resubscribe", email, exp: Date.now() + RESUBSCRIBE_TOKEN_TTL_MS });
}

export function verifyResubscribeToken(token: string): ResubscribeTokenPayload | null {
  const payload = verifyLinkToken<ResubscribeTokenPayload>(token);
  return payload?.purpose === "resubscribe" ? payload : null;
}
