import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
// Rows are never deleted once created (only marked consumed) other than
// the "drop the guest's own still-pending code" cleanup already done in
// createVerificationCode below — with no scheduled job in this codebase
// (no cron infra exists) to prune old ones, the table would otherwise grow
// unbounded forever. Piggybacking a cheap best-effort sweep of anything
// long past both the code TTL and the consumed-trust window onto every
// create call keeps it bounded without needing a cron job.
const STALE_ROW_MS = 24 * 60 * 60 * 1000;
// How long page.tsx trusts a just-consumed `?verified=<id>` query param as
// proof of identity (the "submit"-purpose SSR-hydration fallback for the
// no-JS embedded-HTML-form flow — see getVerifiedRsvpResponses/
// getVerifiedFormResponses). Without this window, that URL would work
// forever (rows are never deleted, only marked consumed), turning a link
// a guest might bookmark, forward, or leave in browser history into a
// permanent bearer token for their saved RSVP/form answers.
const CONSUMED_TRUST_WINDOW_MS = 15 * 60 * 1000;

export type VerificationSubjectType = "rsvp" | "form";
// 'identity': the page-level "verify your email once for this event" gate
// (src/lib/guest-verification.ts) — the common case. No payload; proves
// ownership before any form is even shown, and sets the guest-session
// cookie on success rather than writing/revealing form data.
// 'submit': the per-form fallback used only by the no-JS embedded-HTML-form
// API routes (src/app/api/rsvp/route.ts, src/app/api/forms/[formId]/route.ts),
// which have no page-level gate to go through first — carries a payload
// so verifyCode can write it once verified.
export type VerificationPurpose = "submit" | "identity";

// Created right before an OTP email goes out (src/lib/email.ts's
// deliverVerificationEmail) — `payload` is the fully-built responses/scalars
// for a 'submit' verification (so verifyCode can finish the write without
// the guest re-entering anything), or omitted for 'identity' (which only
// proves email ownership, nothing to write yet).
export async function createVerificationCode(input: {
  subjectType: VerificationSubjectType;
  subjectId: string;
  purpose: VerificationPurpose;
  email: string;
  payload?: unknown;
}): Promise<{ id: string; code: string }> {
  const supabase = createServiceRoleClient();

  // Best-effort cleanup (see STALE_ROW_MS above) — errors here are not
  // fatal to the actual send, just logged, so a transient failure never
  // blocks a guest from getting their code.
  const { error: cleanupError } = await supabase
    .from("email_verification_codes")
    .delete()
    .lt("created_at", new Date(Date.now() - STALE_ROW_MS).toISOString());
  if (cleanupError) console.error("Failed to prune old verification codes", cleanupError);

  // Drop any still-pending codes for this exact (subject, email, purpose) —
  // only one code should ever be redeemable at a time, so a guest who
  // requests a fresh one can't have an older leaked/guessed code still work.
  await supabase
    .from("email_verification_codes")
    .delete()
    .eq("subject_type", input.subjectType)
    .eq("subject_id", input.subjectId)
    .eq("email", input.email)
    .eq("purpose", input.purpose)
    .is("consumed_at", null);

  const code = generateOtpCode();
  const { data, error } = await supabase
    .from("email_verification_codes")
    .insert({
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      purpose: input.purpose,
      email: input.email,
      code_hash: hashOtpCode(code),
      payload: input.payload ?? null,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new DataError(error.message);
  return { id: data.id as string, code };
}

// Read-only, no mutation — two callers rely on this:
// 1. The magic-link GET route, to learn which finalize path to take
//    ('identity' just sets a cookie, 'submit' writes the pending payload)
//    before calling the mutating verify*Code function.
// 2. page.tsx, after being redirected back with `?verified=<id>` — it only
//    trusts that query param if `consumed` comes back true here AND the
//    consumption happened within CONSUMED_TRUST_WINDOW_MS, so a guest
//    can't type a random/unconsumed id into the URL, and the link can't be
//    replayed indefinitely (bookmarked, forwarded, left in browser
//    history) as a standing bearer token for their saved answers.
export async function peekVerification(
  subjectType: VerificationSubjectType,
  verificationId: string
): Promise<{ purpose: VerificationPurpose; subjectId: string; email: string; consumed: boolean } | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("email_verification_codes")
    .select("purpose, subject_id, email, consumed_at")
    .eq("id", verificationId)
    .eq("subject_type", subjectType)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  if (!data) return null;
  const consumedRecently = data.consumed_at !== null && Date.now() - new Date(data.consumed_at).getTime() < CONSUMED_TRUST_WINDOW_MS;
  return {
    purpose: data.purpose as VerificationPurpose,
    subjectId: data.subject_id as string,
    email: data.email as string,
    consumed: consumedRecently,
  };
}

export type VerifyCodeResult =
  | { status: "ok"; email: string; payload: unknown }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "too_many_attempts" };

// Single-use: a successful verification stamps `consumed_at` so the same
// code can never redeem twice, even if the guest's tab double-submits.
//
// Both mutations below are conditioned on the exact `attempts`/
// `consumed_at` value just read (`.eq("attempts", data.attempts)`,
// `.is("consumed_at", null)`) and check `.select()` actually returned a
// row — a plain read-then-write here would race under concurrent guesses:
// two requests reading `attempts=4` could both write `attempts=5`,
// letting more than MAX_ATTEMPTS guesses through, and two requests
// reading the same correct code could both "succeed" and return the
// payload. Conditioning the write on the value just read makes each
// mutation a compare-and-swap — only the request that hasn't been raced
// ahead of gets to apply it; the other sees zero rows updated and is
// treated as a no-op/invalid attempt rather than double-counting or
// double-consuming.
export async function verifyCode(
  subjectType: VerificationSubjectType,
  purpose: VerificationPurpose,
  verificationId: string,
  rawCode: string,
  // Only passed by callers that already have a trusted (not client-derived
  // for *this* purpose) expected subject id to check against — currently
  // just verifyGuestVerification, whose `eventId` argument otherwise comes
  // straight from the client with nothing else tying it to this specific
  // verification row. The 'submit' flows (verifyRsvpEmailCode/
  // verifyFormSubmissionCode) don't have one to pass: the subject id is
  // exactly what they're learning from the row itself.
  expectedSubjectId?: string
): Promise<VerifyCodeResult> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("email_verification_codes")
    .select("id, email, code_hash, payload, attempts, expires_at, consumed_at")
    .eq("id", verificationId)
    .eq("subject_type", subjectType)
    // 'identity' (the page-level "verify once for this event" gate) and
    // 'submit' (the no-JS embedded-form fallback, which carries a payload
    // to write) share the same (subject_type, subject_id) space — e.g. an
    // RSVP identity code and an RSVP submit code for the same event both
    // have subject_type "rsvp", subject_id <eventId>. Without this filter,
    // a code minted for one purpose could be redeemed through the other
    // caller: verifyGuestVerification would consume a 'submit' code and
    // just set a cookie, silently discarding the RSVP/form payload it
    // carried, or verifyRsvpEmailCode/verifyFormSubmissionCode would try to
    // write `payload: null` from an 'identity' code.
    .eq("purpose", purpose);
  if (expectedSubjectId !== undefined) query = query.eq("subject_id", expectedSubjectId);
  const { data, error } = await query.maybeSingle();

  if (error) throw new DataError(error.message);
  if (!data || data.consumed_at) return { status: "invalid" };
  if (data.attempts >= MAX_ATTEMPTS) return { status: "too_many_attempts" };
  if (new Date(data.expires_at).getTime() < Date.now()) return { status: "expired" };

  if (hashOtpCode(rawCode) !== data.code_hash) {
    await supabase
      .from("email_verification_codes")
      .update({ attempts: data.attempts + 1 })
      .eq("id", verificationId)
      .eq("attempts", data.attempts);
    return { status: "invalid" };
  }

  const { data: consumedRow, error: consumeError } = await supabase
    .from("email_verification_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", verificationId)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError) throw new DataError(consumeError.message);
  // Lost the race to a concurrent request that consumed it first (e.g. the
  // guest double-clicked, or opened the magic link in two tabs) — treat as
  // invalid rather than returning the payload/email twice.
  if (!consumedRow) return { status: "invalid" };

  return { status: "ok", email: data.email as string, payload: data.payload };
}
