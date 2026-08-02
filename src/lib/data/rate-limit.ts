import { createServiceRoleClient } from "@/lib/supabase/server";

// Rows are never touched again once their own window has passed if the
// same key never gets a second hit — the overwhelming common case (an
// invite submits its RSVP once and is never touched again; a guest
// verifies once). Per-key pruning alone (below) only fires on a
// *subsequent* call for that exact key, so a one-off key's single row
// would otherwise live forever — same reasoning as
// email-verification.ts's STALE_ROW_MS, and the fix is the same shape: an
// unconditional (not key-scoped) sweep on every call, bounded by a fixed
// ceiling well above every caller's actual window (the longest in use
// today is the resubscribe form's 30-day monthly cap — see
// peekMultiWindowRateLimit below; raised from 24h to 31d to cover it,
// which is safe for every shorter-window caller too — the global sweep is
// only a table-bloat bound, never what makes any individual check correct;
// each key's own window-scoped delete/count already handles that).
const STALE_ROW_MS = 31 * 24 * 60 * 60 * 1000;

// Cross-instance sliding-window rate limiter backed by
// `public.rate_limit_hits` (see supabase/schema-saas.sql) — unlike
// src/lib/rate-limit.ts's in-memory `Map`, this holds regardless of how
// many server instances are handling traffic. Every call both counts
// existing hits in the window AND records the current one in a single
// round trip's worth of work: count first (cheap, indexed), and only
// insert a new hit row if the caller isn't already over the limit — a
// rejected request shouldn't itself count toward the next window.
export async function checkRateLimit(key: string, maxHits: number, windowMs: number): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Best-effort prune, both scopes — failures here shouldn't block the
  // actual check. The key-scoped delete keeps a *hot* key's row count
  // bounded to its own window; the global sweep is what actually bounds
  // total table growth for the common one-off-key case (see STALE_ROW_MS
  // above).
  await supabase.from("rate_limit_hits").delete().eq("key", key).lt("created_at", windowStart);
  await supabase.from("rate_limit_hits").delete().lt("created_at", new Date(Date.now() - STALE_ROW_MS).toISOString());

  const { count, error } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  // Fail open: if the rate-limit store itself is unreachable, don't take
  // down the public write path over it — the in-memory floor in
  // src/lib/rate-limit.ts still applies as a fallback layer.
  if (error) {
    console.error(`Rate-limit check failed for key ${key}:`, error.message);
    return false;
  }

  if ((count ?? 0) >= maxHits) return true;

  const { error: insertError } = await supabase.from("rate_limit_hits").insert({ key });
  if (insertError) console.error(`Rate-limit hit-record failed for key ${key}:`, insertError.message);

  return false;
}

// Read-only variant of the count-check above, with no insert side effect —
// needed wherever a single logical request must pass *several* independent
// limit checks (e.g. resubscribe below: an email-scoped AND an ip-scoped
// limit, each with a daily AND a monthly cap) before any of them are
// allowed to record a hit. `checkRateLimit`'s combined count-then-insert
// can't be called twice for the same identity without double-recording, so
// this and `recordRateLimitHit` split that into two explicit steps.
async function peekRateLimit(key: string, maxHits: number, windowMs: number): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  if (error) {
    console.error(`Rate-limit peek failed for key ${key}:`, error.message);
    return false; // fail open, same as checkRateLimit
  }

  return (count ?? 0) >= maxHits;
}

async function recordRateLimitHit(key: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rate_limit_hits").insert({ key });
  if (error) console.error(`Rate-limit hit-record failed for key ${key}:`, error.message);
}

export type RateLimitWindow = { maxHits: number; windowMs: number };

// True if `key` is over the limit under ANY of the given windows (e.g. a
// 2-per-day AND a 5-per-30-day cap checked together) — read-only, records
// nothing. Pair with `recordMultiWindowHit` once every identity involved
// in a request (e.g. both email and IP) has been peeked and none are
// throttled, so a request ultimately rejected on one identity's limit
// never partially counts against another identity's window.
export async function peekMultiWindowRateLimit(key: string, windows: RateLimitWindow[]): Promise<boolean> {
  for (const { maxHits, windowMs } of windows) {
    if (await peekRateLimit(key, maxHits, windowMs)) return true;
  }
  return false;
}

export async function recordMultiWindowHit(key: string): Promise<void> {
  await recordRateLimitHit(key);
}

// The peek/record split above deliberately skips per-key pruning (peeking
// must stay read-only) — call this once per request using multi-window
// checks so long-window keys (e.g. the resubscribe form's 30-day cap)
// still get cleaned up even during a stretch with no `checkRateLimit`
// traffic elsewhere to trigger the global sweep incidentally.
export async function pruneStaleRateLimitHits(): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rate_limit_hits").delete().lt("created_at", new Date(Date.now() - STALE_ROW_MS).toISOString());
  if (error) console.error("Rate-limit stale-row prune failed:", error.message);
}
