import { getClientIp, isThrottled } from "@/lib/rate-limit";
import { peekMultiWindowRateLimit, recordMultiWindowHit, pruneStaleRateLimitHits } from "@/lib/data/rate-limit";
import { removeAllUnsubscribesForEmail } from "@/lib/data/email-unsubscribes";
import { signResubscribeToken, verifyResubscribeToken } from "@/lib/unsubscribe-token";
import { deliverResubscribeConfirmationEmail } from "@/lib/email";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

// 2/day and 5/month, checked identically for the requesting email AND the
// requesting IP — an attacker who doesn't control the target inbox can
// still be bounded by their own IP's limit, and the email-scoped limit
// bounds abuse spread across many IPs against one target address.
const RESUBSCRIBE_WINDOWS = [
  { maxHits: 2, windowMs: DAY_MS },
  { maxHits: 5, windowMs: MONTH_MS },
];

// The peek-then-record split (see peekMultiWindowRateLimit's own comment)
// is two separate round trips, not one atomic check-and-increment — two
// truly concurrent requests for the same email/IP could both pass the peek
// before either records, letting a burst slip one hit past the cap. A
// short in-memory floor (the same pattern guest-verification.ts's
// MIN_MS_BETWEEN_REQUESTS uses) closes the common same-instance case
// cheaply; it doesn't hold across multiple server instances, but the
// residual risk for a low-value action like this is acceptable.
const MIN_MS_BETWEEN_REQUESTS = 2000;

export type ResubscribeRequestResult = { status: "sent" } | { status: "rate_limited" };

// Step 1: a visitor submits just an email on /resubscribe. Always
// rate-limit-checked (both identities) before ever touching
// email_unsubscribes or sending mail, and always returns the same
// generic "sent" outcome regardless of whether that email actually has
// anything to resubscribe from — same anti-enumeration pattern as
// requestPasswordReset in src/lib/auth-actions.ts, so this form can't be
// used to probe which addresses are unsubscribed anywhere.
export async function requestResubscribe(rawEmail: string): Promise<ResubscribeRequestResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { status: "rate_limited" };

  const ip = await getClientIp();
  if (isThrottled(`resub:email:${email}`, MIN_MS_BETWEEN_REQUESTS) || isThrottled(`resub:ip:${ip}`, MIN_MS_BETWEEN_REQUESTS)) {
    return { status: "rate_limited" };
  }

  await pruneStaleRateLimitHits();

  const [emailThrottled, ipThrottled] = await Promise.all([
    peekMultiWindowRateLimit(`resub:email:${email}`, RESUBSCRIBE_WINDOWS),
    peekMultiWindowRateLimit(`resub:ip:${ip}`, RESUBSCRIBE_WINDOWS),
  ]);
  if (emailThrottled || ipThrottled) return { status: "rate_limited" };

  // Only recorded once BOTH checks above have already passed — a request
  // rejected on one identity's limit must never partially count against
  // the other's window (see peekMultiWindowRateLimit's own comment).
  await Promise.all([recordMultiWindowHit(`resub:email:${email}`), recordMultiWindowHit(`resub:ip:${ip}`)]);

  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const token = signResubscribeToken(email);
  const confirmUrl = `${siteUrl}/resubscribe/confirm?token=${encodeURIComponent(token)}`;

  // Sent regardless of whether this address has any unsubscribe rows at
  // all — checking first and skipping the send for a "clean" address
  // would let the rate-limit-gated send itself become an oracle (an
  // attacker learns "no email arrived" => "that address has never
  // unsubscribed"). Clicking the link when there's nothing to clear is
  // simply a no-op on confirmation.
  //
  // Caught, not propagated: a Resend-side failure (invalid address, API
  // outage) must not surface as a raw error to the caller — that would
  // both break the anti-enumeration guarantee above (a distinguishable
  // failure mode leaks information a generic message doesn't) and give a
  // worse experience than just quietly not delivering. The rate-limit hit
  // already recorded above is not rolled back on a failed send, matching
  // requestPasswordReset's equivalent trade-off (auth-actions.ts) of
  // counting the attempt rather than letting a delivery failure become a
  // free retry.
  try {
    await deliverResubscribeConfirmationEmail(email, confirmUrl);
  } catch (err) {
    console.error("Failed to send resubscribe confirmation email:", err);
  }

  return { status: "sent" };
}

export type ResubscribeConfirmResult = { status: "confirmed" } | { status: "invalid_or_expired" };

// Step 2: the visitor clicks the link from their own inbox — proof of
// control is the token's signature + the fact it arrived at that address,
// not anything typed into a form.
export async function confirmResubscribe(token: string): Promise<ResubscribeConfirmResult> {
  const payload = verifyResubscribeToken(token);
  if (!payload) return { status: "invalid_or_expired" };

  await removeAllUnsubscribesForEmail(payload.email);
  return { status: "confirmed" };
}
