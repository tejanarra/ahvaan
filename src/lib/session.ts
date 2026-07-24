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

// Constant-time string comparison, portable to both the Edge runtime
// (middleware) and Node (server actions). HMAC-signing both strings first
// means the comparison itself (via subtle.verify's constant-time guarantee)
// never depends on where `a` and `b` first differ, or even on their
// relative lengths, since SHA-256 digests are always the same size.
let compareKeyPromise: Promise<CryptoKey> | null = null;
function getCompareKey() {
  if (!compareKeyPromise) {
    compareKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("timing-safe-compare"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return compareKeyPromise;
}

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const key = await getCompareKey();
  const digestA = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(a));
  return crypto.subtle.verify("HMAC", key, digestA, new TextEncoder().encode(b));
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
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

  const signatureBytes = fromHex(signature);
  if (!signatureBytes) return false;

  const key = await getHmacKey();
  // subtle.verify performs a constant-time comparison internally, unlike
  // comparing two hex strings with `===`.
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(expires)
  );
}
