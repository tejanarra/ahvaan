import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

function cookieName(eventId: string) {
  return `gv_${eventId}`;
}

type SessionPayload = { email: string; eventId: string; exp: number };

function sign(payload: SessionPayload): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", requireEnv("GUEST_SESSION_SECRET")).update(json).digest("base64url");
  return `${json}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;

  const expectedSig = createHmac("sha256", requireEnv("GUEST_SESSION_SECRET")).update(json).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.email !== "string" || typeof payload.eventId !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// The identity a no-invite guest establishes once by verifying their email
// (src/lib/guest-verification.ts) for a specific 'email_verified'-mode
// event — plays the same role an invite link plays (a trusted identity to
// gate/prefill/submit against), but set interactively via a cookie instead
// of carried in a URL param. Event-scoped (one cookie per event id) so a
// browser can independently be verified for several events. Only a Server
// Action or Route Handler can call the setter — cookies() throws on
// mutation attempts from a Server Component render.
export async function setVerifiedGuestCookie(eventId: string, email: string): Promise<void> {
  const exp = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const store = await cookies();
  store.set(cookieName(eventId), sign({ email, eventId, exp }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

// Lets a guest deliberately end their own verified session for this event
// (the "Submitted as x@y.com — Change?" footer, guest-identity-footer.tsx)
// — e.g. they verified under the wrong address, or a shared/kiosk device
// is about to be handed to someone else. Same Server-Action-or-Route-
// Handler-only restriction as the setter above.
export async function clearVerifiedGuestCookie(eventId: string): Promise<void> {
  const store = await cookies();
  store.delete(cookieName(eventId));
}

// Read-only — safe from Server Components, Server Actions, and Route
// Handlers alike. Returns null for a missing, malformed, tampered,
// expired, or wrong-event cookie — any of those should just fall back to
// "not verified," never throw.
export async function getVerifiedGuestEmail(eventId: string): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(cookieName(eventId))?.value;
  if (!raw) return null;

  const payload = verify(raw);
  if (!payload) return null;
  if (payload.eventId !== eventId) return null;
  if (payload.exp < Date.now()) return null;

  return payload.email;
}
