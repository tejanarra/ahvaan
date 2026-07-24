export const ADMIN_COOKIE = "rsvp_admin_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable");
  return secret;
}

async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Signed, stateless session token: "<expiry>.<hmac>". No session data beyond
// "an admin is logged in" needs to be stored, so a signature is enough.
export async function createAdminSessionToken(ttlMs = 1000 * 60 * 60 * 12) {
  const expires = Date.now() + ttlMs;
  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(expires))
  );
  return `${expires}.${toHex(signatureBuffer)}`;
}

export async function isValidAdminSessionToken(token: string | undefined) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (Date.now() > Number(expires)) return false;

  const key = await getHmacKey();
  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(expires)
  );

  return toHex(expectedBuffer) === signature;
}
