// A tiny in-memory per-key throttle for public write paths (docs/02 W9,
// docs/08 "Public write-path limits"). Deliberately not a real rate
// limiter: it only needs to turn a rapid-fire submit loop into a handful
// of rejected requests instead of a hammering the DB on every keystroke of
// a broken client — the upsert-on-invite-id write path already makes
// actual spam self-overwriting, this just adds a floor between attempts.
//
// Caveat (documented, not solved here): this map is per server instance —
// on a multi-instance deployment (e.g. multiple Vercel lambdas) each
// instance has its own map, so the effective limit is "per key, per
// instance" rather than global. Acceptable at this project's scale; a real
// limit would need shared storage (e.g. a Supabase table or Redis).
const lastSeenAt = new Map<string, number>();

// Bounds the map's size so a flood of distinct keys (e.g. many different
// invite ids hit once each) can't grow it unboundedly — old entries are
// evicted oldest-first once the cap is hit.
const MAX_ENTRIES = 10_000;

export function isThrottled(key: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const last = lastSeenAt.get(key);

  if (lastSeenAt.size >= MAX_ENTRIES && !lastSeenAt.has(key)) {
    const oldestKey = lastSeenAt.keys().next().value;
    if (oldestKey !== undefined) lastSeenAt.delete(oldestKey);
  }
  lastSeenAt.set(key, now);

  return last !== undefined && now - last < minIntervalMs;
}
