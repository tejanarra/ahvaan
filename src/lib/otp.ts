import { randomInt, createHash } from "node:crypto";

// A 6-digit code is low entropy by design (it has to be typeable), so it's
// never the only defense: short expiry + a capped attempt count (enforced
// by src/lib/data/email-verification.ts) do the real work. Hashing it before
// storage just means a DB dump alone can't be replayed without also beating
// those two limits within the code's lifetime.
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
