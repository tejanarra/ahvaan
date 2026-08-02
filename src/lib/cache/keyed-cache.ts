// A minimal per-key cache for expensive, read-heavy lookups (public event
// pages, public host profiles) that only change when an explicit write
// happens. Exists because `unstable_cache`'s `tags` option is fixed at
// definition time and can't be templated per call argument — passing a
// per-key tag string there silently does nothing, so a `revalidateTag` at
// write time never matches anything cached under it (the bug this module
// fixes). Here, invalidation deletes the exact key directly, so it always
// works. A TTL is still kept as a safety net in case a write path is ever
// added without remembering to call `invalidate`.
//
// Same in-memory, per-instance caveat as src/lib/rate-limit.ts: on a
// multi-instance deployment each instance has its own cache, so a write
// handled by instance A won't invalidate instance B's copy until that
// entry's TTL expires there. Acceptable at this scale (a few extra seconds
// of staleness on other instances, never longer); revisit alongside
// rate-limit.ts if traffic grows enough to need a shared cache (e.g. a
// Supabase-backed or Redis-backed store).
const DEFAULT_TTL_MS = 30_000;

type CacheEntry<T> = { value: T; expiresAt: number };

export function createKeyedCache<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyFn: (...args: Args) => string,
  ttlMs: number = DEFAULT_TTL_MS
) {
  const store = new Map<string, CacheEntry<T>>();

  async function get(...args: Args): Promise<T> {
    const key = keyFn(...args);
    const now = Date.now();
    const cached = store.get(key);
    if (cached && cached.expiresAt > now) return cached.value;

    const value = await fn(...args);
    store.set(key, { value, expiresAt: now + ttlMs });
    return value;
  }

  function invalidate(key: string) {
    store.delete(key);
  }

  return { get, invalidate };
}
