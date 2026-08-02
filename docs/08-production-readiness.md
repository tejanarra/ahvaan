# 08 — Production Readiness & Launch Checklist

The spec for Phase 5 and the gate for Phase 6. Every item gets checked with
evidence (command output, screenshot, or test note recorded in SAAS_PLAN.md).

## Security hardening

- [x] **RLS policies (defense-in-depth).** Verified in `schema-saas.sql`:
  every table has `enable row level security` + an idempotent
  (`drop policy if exists` + `create policy`) `host_id = auth.uid()` policy
  for `authenticated`, none for `anon`. **Not yet verified**: an anon-key
  query attempt against a *live* project — this is a code-level check only;
  confirm against production before launch (schema changes here are applied
  manually, not via migration tooling — see doc 02's decision log).
- [x] **Public write-path limits** (doc 02 W9): zod max lengths + 64KB
  payload cap confirmed on `submitRsvp`/generic-form submit
  (`src/lib/schemas/size-budget.ts`); per-invite/per-email/per-IP throttle
  present. Upgraded this session from purely in-memory (silently
  under-enforces across multiple server instances) to a cross-instance,
  DB-backed sliding-window limiter (`src/lib/data/rate-limit.ts`,
  `public.rate_limit_hits` in `schema-saas.sql`), layered under the
  existing in-memory floor as a fast-path. Also added: a real rate limit on
  guest email-verification sends (previously identity-keyed only, so an
  attacker supplying an arbitrary victim email had no floor at all), and a
  pre-parse `Content-Length` cap on the two public API routes.
- [x] **Sandbox invariants re-audit**: grep-verified zero `allow-same-origin`
  anywhere in `src/`; `parseInlineStyle` (`src/lib/blocks/layout-controls.tsx`)
  confirmed rejecting `url(`/`expression(`; custom-page frame unchanged.
  Hardened further this session: `buildSandboxSrcDoc` now escapes a literal
  `</script>`/`</style>` inside host-authored js/css (previously could
  early-close its own tag), and the sandboxed iframe's inline `<script>` is
  now nonce'd to survive the new nonce-based top-level CSP (see Headers,
  below) without weakening the sandbox itself.
- [x] **Draft privacy**: confirmed a real session-identity ownership check
  (`event.host_id` must match the signed-in user), not just an unguessable
  `?preview=1` param — verified in `src/app/events/[slug]/page.tsx`.
- [x] **Headers**: `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`
  (`next.config.ts`). `Content-Security-Policy` upgraded this session from a
  static `script-src 'self' 'unsafe-inline'` (meaningfully weakens CSP's
  XSS protection) to a real per-request nonce + `'strict-dynamic'`
  (`src/proxy.ts`, now running on effectively every route, not just the
  four auth-related paths it used to). `frame-src` still allows the
  sandboxed srcdoc iframes (same-origin, inherits this policy) + the Google
  Maps embed; no third-party script origins.
- [x] **Secrets**: `.env.example` current (cross-checked against every
  `process.env`/`requireEnv` call site — no undocumented var, no
  documented-but-unused var); `SUPABASE_SERVICE_ROLE_KEY` confirmed used
  only in `src/lib/supabase/server.ts`, never in a `"use client"` file.

## Email

- [ ] Verify the sending domain in Resend (or point `RESEND_FROM_EMAIL` at
  an already-verified one); send + receive a real invite and reminder;
  links in the email resolve to the correct `/events/[slug]?i=` URL from
  `NEXT_PUBLIC_SITE_URL`. **Unable to verify** — requires a live Resend
  account/production domain, which this environment doesn't have.
- [ ] Email templates re-styled to the design system (paper palette, display
  serif in the header image/alt-safe fallback, plain-text part included).
  **Unable to verify** without a live rendering pass.
- [x] `email_sends` rows populated with `host_id`/`event_id`/`error` on both
  success and failure paths — confirmed at every `logEmailSend` call site.
  Bulk reminders now batch these into one multi-row insert
  (`logEmailSends`, `src/lib/data/email-log.ts`) instead of one insert per
  invite, same data guarantee, fewer round trips for hosts with large
  guest lists.

## Error & empty surfaces (doc 02 W8)

- [x] Root `error.tsx` + per-group `not-found.tsx` (Studio and Stage voices
  per doc 05) + `loading.tsx` skeletons for dashboard list and workspace —
  all confirmed present. Added this session: scoped `error.tsx` under
  `dashboard/events/[eventId]/` and `events/[slug]/` (previously only the
  root one existed, so any error in the event workspace or on a guest page
  fell all the way to the root Studio-branded screen instead of staying in
  that route's own voice/chrome).
- [x] Every server action returns a user-readable error state (no silent
  catch, no raw Postgres messages shown) — confirmed by reading every
  action file; all format via `err instanceof Error ? err.message : "..."`.
- [x] 404 for: bad slug, draft (logged out), other host's event id, bad
  invite id (falls back to view-only page) — confirmed in
  `src/app/events/[slug]/page.tsx` and `src/app/dashboard/not-found.tsx`.

## SEO / metadata

- [x] `/` metadata + OG image per doc 06; `robots.txt` allowing `/` and
  disallowing `/dashboard`, `/events/` (guest pages are semi-private — keep
  them out of the index); `sitemap.xml` with the marketing page only — all
  confirmed present in `src/app/{robots,sitemap,opengraph-image}.ts`.
- [x] `/events/[slug]` `generateMetadata`: event title/subtitle, `noindex`,
  no guest PII ever in meta tags — confirmed; drafts additionally withhold
  their real title/OG image entirely (not just noindex).
- [x] Favicon/app icons re-exported with the new brand mark — confirmed
  present (`src/app/icon.png`, `icon.svg`, `apple-icon.png`).
- [x] PWA manifest (`src/app/manifest.ts`) + minimal service worker
  (`public/sw.js`, registered by `src/components/service-worker-register.tsx`)
  — exists only for installability + a bare offline "/" fallback on page
  navigations; deliberately caches nothing else (dashboard/RSVP/guest pages
  are dynamic, per-host data — see the file's own comment). Not previously
  documented anywhere in this doc set. Also fixed this session:
  `start_url` was `/dashboard` (auth-gated — a logged-out install launched
  straight into a redirect), now `/`.

## Accessibility sweep (bars from doc 04)

Code-level fixes landed this session, ahead of the live sweep below (real
gaps caught by static review, not yet confirmed with an actual
keyboard/axe pass): Modal had no focus trap or focus-restore-on-close
(added); `Field`/`PublicField` rendered a `<label>` never associated with
its input via `htmlFor`/`id` (fixed, auto-wired via `useId()`); `ToggleGroup`
had no roving-tabindex/arrow-key support despite the doc requiring it
(added, single-select mirrors native radio-group behavior); form/action
error text had no `aria-live` region (added `role="alert"`/`role="status"`
across `Field`, `PublicField`, `Toast`, and every inline error paragraph in
the RSVP/custom-form/guest-dashboard flows); inputs under 16px font-size
triggered iOS Safari's auto-zoom-on-focus (fixed — `text-base sm:text-sm`
on `Input`/`Textarea`/`Select`/every guest-facing field control).

- [ ] Keyboard-only run-through of: signup → create → design → invite →
  guest RSVP → edit RSVP. No traps, visible focus everywhere. **Unable to
  verify** — requires a live browser session.
- [ ] axe (or Lighthouse a11y) ≥ 95 on: home, login, dashboard, workspace
  tabs, one themed guest page per palette family (light + dark theme).
  **Unable to verify** — requires a live browser session.
- [ ] Guest themes: verify each of the 8 themes' fg/bg and accent pairs pass
  AA; adjust theme colors (not the checker) where they fail. **Unable to
  verify** — requires a live browser session / contrast-checking tool.
- [ ] Reduced-motion verified on builder, modals, marketing reveals.
  **Unable to verify** live, but confirmed at the code level: `globals.css`
  has a global `prefers-reduced-motion: reduce` floor, and `reveal.tsx`
  checks it explicitly before animating.

## Performance budgets

- [ ] `/events/[slug]`: LCP < 1.5s (4G throttle), zero third-party JS except
  the maps embed (lazy, `loading="lazy"` iframe), theme fonts preloaded.
  **Unable to verify** LCP/throttled numbers live, but the "HTML cached"
  half of this item is now actually true: the public-page cache was
  silently broken (see below) and is fixed this session, and the page's
  independent data lookups (host profile, custom components/forms) are now
  fetched concurrently instead of serially, cutting the number of
  sequential round trips before first byte.
- [ ] `/`: LCP < 1.8s, CLS < 0.1, Lighthouse perf ≥ 95. **Unable to
  verify** — requires a live Lighthouse run.
- [ ] Dashboard list first-load JS < 150KB gzip; builder routes are the only
  ones shipping dnd-kit. **Unable to verify** — Turbopack's `next build`
  output in this environment doesn't print the classic per-route
  First-Load-JS table; re-check with a webpack build or a bundle analyzer.
- [ ] No image without dimensions/`sizes`; uploads served resized via
  Supabase transform params where used in cards. **Unable to verify**
  without a live rendering pass.

**Critical fix landed this session, not in the original checklist**:
`getEventBySlugPublicCached`/`getHostProfilePublicCached`
(`src/lib/data/{events,host-profile}.ts`) used `unstable_cache` with a
static, empty `tags: []` — `unstable_cache`'s tags can't be templated per
call argument, so every `revalidateTag` call at write time (host saves a
page edit, changes the RSVP deadline, uploads a cover image, etc.) matched
nothing. In practice this meant a host's own edits could fail to reach
their live guest page. Replaced with a manually-keyed cache
(`src/lib/cache/keyed-cache.ts`) whose `invalidate(key)` deletes the exact
entry a write just changed, so invalidation actually works. Covered by a
unit test (`src/lib/cache/keyed-cache.test.ts`) asserting a write-then-read
sees the fresh value.

## Deployment & operations

None of this section is code-verifiable from a repo checkout — every item
below requires access to the live Vercel/Supabase projects, which this
environment doesn't have. Added this session, relevant to the first
bullet: a GitHub Actions CI workflow (`.github/workflows/ci.yml`) running
lint/test/build on every push and PR — not a substitute for verifying the
*production* env, but it means a broken build/test can no longer merge to
`main` unnoticed.

- [ ] Production env on Vercel (or equivalent): all env vars set,
  `NEXT_PUBLIC_SITE_URL` = real domain, custom domain + HTTPS. **Unable to
  verify.**
- [ ] Supabase: PITR/backups enabled; confirm all indexes from
  `schema-saas.sql` exist in prod; auth email templates (confirm/reset)
  branded and pointing at the prod domain; "Confirm email" decision made
  deliberately for prod (ON for launch — revisit the signup flow copy).
  **Unable to verify** — also note `schema-saas.sql` has historically been
  run manually against the live project (see `SAAS_PLAN.md`), not via
  migration tooling, so confirm the two most recent additions
  (`host_profiles`, this session's `rate_limit_hits`) have actually been
  applied before relying on either.
- [ ] Runtime error visibility: at minimum, Vercel log drains reviewed;
  optionally Sentry (decide, don't drift into it). **Unable to verify.**
- [ ] Rollback story: previous deployment re-promotable; schema changes are
  additive-only so old code runs against new schema. **Unable to verify**
  the live deployment story; the schema-file side is true — every change
  in `schema-saas.sql`, including this session's, is additive
  (`create table/column/index if not exists`).
- [ ] Legal minimum: real Privacy + Terms pages linked from the footer
  (hosts store guests' names/emails — privacy policy is not optional).
  **Unable to verify** content accuracy, but `/privacy` and `/terms` routes
  are confirmed present in `src/app/`.

## Launch QA script (Phase 6 input)

Fresh prod account, desktop + real phone: the five doc-01 use cases, plus
draft→publish, deadline close, image upload, CSV export, password reset,
bulk reminder to a real inbox, tenant isolation re-check with a second
account, and one power-host pass (container nesting + custom code block
still sandboxed in prod). Cross-browser: Chrome, Safari macOS/iOS, Firefox.
