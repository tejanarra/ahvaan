import { describe, expect, it, beforeAll } from "vitest";
import { signLinkToken, verifyLinkToken } from "./signed-link-token";

beforeAll(() => {
  process.env.GUEST_SESSION_SECRET ??= "test-secret-do-not-use-in-prod";
});

type Payload = { foo: string; exp: number };

describe("signLinkToken / verifyLinkToken", () => {
  it("round-trips a payload signed with a future expiry", () => {
    const token = signLinkToken({ foo: "bar", exp: Date.now() + 10_000 });
    const payload = verifyLinkToken<Payload>(token);
    expect(payload?.foo).toBe("bar");
  });

  it("rejects a token past its expiry", () => {
    const token = signLinkToken({ foo: "bar", exp: Date.now() - 1 });
    expect(verifyLinkToken<Payload>(token)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signLinkToken({ foo: "bar", exp: Date.now() + 10_000 });
    const [json, sig] = token.split(".");
    const tamperedJson = Buffer.from(JSON.stringify({ foo: "evil", exp: Date.now() + 10_000 })).toString("base64url");
    expect(verifyLinkToken<Payload>(`${tamperedJson}.${sig}`)).toBeNull();
    expect(verifyLinkToken<Payload>(`${json}.wrongsig`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyLinkToken<Payload>("")).toBeNull();
    expect(verifyLinkToken<Payload>("not-a-token")).toBeNull();
    expect(verifyLinkToken<Payload>("a.b.c")).toBeNull();
  });
});
