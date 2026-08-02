import { describe, expect, it, vi } from "vitest";
import { createKeyedCache } from "./keyed-cache";

describe("createKeyedCache", () => {
  it("caches a value for the same key", async () => {
    const fn = vi.fn(async (key: string) => `value-for-${key}`);
    const cache = createKeyedCache(fn, (key) => key, 10_000);

    expect(await cache.get("a")).toBe("value-for-a");
    expect(await cache.get("a")).toBe("value-for-a");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("computes independently per key", async () => {
    const fn = vi.fn(async (key: string) => `value-for-${key}`);
    const cache = createKeyedCache(fn, (key) => key, 10_000);

    await cache.get("a");
    await cache.get("b");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("invalidate() forces a fresh compute on the next get()", async () => {
    // This is the exact bug docs-audit C1 found: a write must actually be
    // able to force the next read to bypass the cache, or a host's edit
    // never reaches the public page.
    const fn = vi.fn(async (key: string) => `value-for-${key}`);
    const cache = createKeyedCache(fn, (key) => key, 10_000);

    await cache.get("a");
    cache.invalidate("a");
    await cache.get("a");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("expires entries after the TTL", async () => {
    const fn = vi.fn(async (key: string) => `value-for-${key}`);
    const cache = createKeyedCache(fn, (key) => key, 10);

    await cache.get("a");
    await new Promise((resolve) => setTimeout(resolve, 20));
    await cache.get("a");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
