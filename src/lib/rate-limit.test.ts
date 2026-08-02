import { describe, expect, it } from "vitest";
import { isThrottled } from "./rate-limit";

describe("isThrottled", () => {
  it("allows the first hit for a fresh key", () => {
    expect(isThrottled(`test-key-${Math.random()}`, 2000)).toBe(false);
  });

  it("throttles a second hit within the interval", () => {
    const key = `test-key-${Math.random()}`;
    expect(isThrottled(key, 2000)).toBe(false);
    expect(isThrottled(key, 2000)).toBe(true);
  });

  it("does not throttle once the interval has elapsed", async () => {
    const key = `test-key-${Math.random()}`;
    expect(isThrottled(key, 10)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(isThrottled(key, 10)).toBe(false);
  });

  it("keys are independent of each other", () => {
    const keyA = `test-key-a-${Math.random()}`;
    const keyB = `test-key-b-${Math.random()}`;
    expect(isThrottled(keyA, 2000)).toBe(false);
    expect(isThrottled(keyB, 2000)).toBe(false);
  });
});
