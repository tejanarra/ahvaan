import { createHmac, timingSafeEqual } from "node:crypto";

// A generic signed, expiring URL token — the same base64url(payload).sig
// shape as src/lib/guest-session.ts's cookie signer, reused here for
// clickable email links instead of a cookie (unsubscribe, resubscribe
// confirmation). Kept independent of guest-session.ts on purpose: cookies
// and one-click email links have different threat models (a cookie never
// leaves the browser; a link travels through an inbox that could be
// scanned/forwarded), but sharing the same signing secret and HMAC
// construction is fine — GUEST_SESSION_SECRET is a single app-wide secret,
// not scoped to one use case.
function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

export function signLinkToken(payload: Record<string, unknown>): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", requireEnv("GUEST_SESSION_SECRET")).update(json).digest("base64url");
  return `${json}.${sig}`;
}

// Returns null for anything malformed, tampered, or expired — every caller
// treats an invalid token as "this link doesn't work anymore," never an
// error page, since these tokens travel through inboxes/link-preview
// scanners and expiry/staleness is an expected, non-exceptional outcome.
export function verifyLinkToken<T extends { exp: number }>(token: string): T | null {
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;

  const expectedSig = createHmac("sha256", requireEnv("GUEST_SESSION_SECRET")).update(json).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8")) as T;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
