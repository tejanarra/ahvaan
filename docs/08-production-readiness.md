# 08 — Production Readiness & Launch Checklist

The spec for Phase 5 and the gate for Phase 6. Every item gets checked with
evidence (command output, screenshot, or test note recorded in SAAS_PLAN.md).

## Security hardening

- [ ] **RLS policies (defense-in-depth).** Keep the service-role/code-level
  model primary; add real policies so a leaked anon key or future client
  query stays harmless: `events/invites/rsvps/email_sends` — authenticated
  users may `select/insert/update/delete` only rows where
  `host_id = auth.uid()`; anon gets nothing (public reads continue via
  service role only). Idempotent `drop policy if exists` + `create policy`
  in `schema-saas.sql`. Verify with an anon-key query attempt.
- [ ] **Public write-path limits** (doc 02 W9): zod max lengths + ≤64KB
  payload cap on `submitRsvp`; per-invite throttle (≥ 2s between writes is
  enough — upsert makes spam self-overwriting; a tiny in-memory limiter is
  acceptable at this scale, document the multi-instance caveat).
- [ ] **Sandbox invariants re-audit**: grep-verify no `allow-same-origin`
  anywhere; `parseInlineStyle` rejects `url(` and `expression(` values;
  custom-page frame unchanged.
- [ ] **Draft privacy**: unauthenticated fetch of a draft slug 404s; host
  preview link works; preview param not guessable (signed or session-bound).
- [ ] **Headers**: sensible `Content-Security-Policy` (allow `frame-src`
  for the sandboxed srcdoc iframes + Google Maps embed; no third-party
  script origins), `X-Frame-Options: SAMEORIGIN` on Studio routes,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] **Secrets**: `.env.example` current; service key never imported into
  any client component (grep `SUPABASE_SERVICE_ROLE_KEY` usages).

## Email

- [ ] Verify the sending domain in Resend (or point `RESEND_FROM_EMAIL` at
  an already-verified one); send + receive a real invite and reminder;
  links in the email resolve to the correct `/e/[slug]?i=` URL from
  `NEXT_PUBLIC_SITE_URL`.
- [ ] Email templates re-styled to the design system (paper palette, display
  serif in the header image/alt-safe fallback, plain-text part included).
- [ ] `email_sends` rows populated with `host_id`/`event_id`/`error` (Phase
  0 columns) on both success and failure paths.

## Error & empty surfaces (doc 02 W8)

- [ ] Root `error.tsx` + per-group `not-found.tsx` (Studio and Stage voices
  per doc 05) + `loading.tsx` skeletons for dashboard list and workspace.
- [ ] Every server action returns a user-readable error state (no silent
  catch, no raw Postgres messages shown).
- [ ] 404 for: bad slug, draft (logged out), other host's event id, bad
  invite id (falls back to view-only page — verify still true post-refactor).

## SEO / metadata

- [ ] `/` metadata + OG image per doc 06; `robots.txt` allowing `/` and
  disallowing `/dashboard`, `/e/` (guest pages are semi-private — keep them
  out of the index); `sitemap.xml` with the marketing page only.
- [ ] `/e/[slug]` `generateMetadata`: event title/subtitle, `noindex`,
  no guest PII ever in meta tags.
- [ ] Favicon/app icons re-exported with the new brand mark.

## Accessibility sweep (bars from doc 04)

- [ ] Keyboard-only run-through of: signup → create → design → invite →
  guest RSVP → edit RSVP. No traps, visible focus everywhere.
- [ ] axe (or Lighthouse a11y) ≥ 95 on: home, login, dashboard, workspace
  tabs, one themed guest page per palette family (light + dark theme).
- [ ] Guest themes: verify each of the 8 themes' fg/bg and accent pairs pass
  AA; adjust theme colors (not the checker) where they fail.
- [ ] Reduced-motion verified on builder, modals, marketing reveals.

## Performance budgets

- [ ] `/e/[slug]`: LCP < 1.5s (4G throttle), zero third-party JS except the
  maps embed (lazy, `loading="lazy"` iframe), theme fonts preloaded, HTML
  cached via the Phase 0 tag cache.
- [ ] `/`: LCP < 1.8s, CLS < 0.1, Lighthouse perf ≥ 95.
- [ ] Dashboard list first-load JS < 150KB gzip; builder routes are the only
  ones shipping dnd-kit (check `next build` output table, record numbers).
- [ ] No image without dimensions/`sizes`; uploads (Phase 4) served resized
  via Supabase transform params where used in cards.

## Deployment & operations

- [ ] Production env on Vercel (or equivalent): all env vars set,
  `NEXT_PUBLIC_SITE_URL` = real domain, custom domain + HTTPS.
- [ ] Supabase: PITR/backups enabled; confirm all indexes from
  `schema-saas.sql` exist in prod; auth email templates (confirm/reset)
  branded and pointing at the prod domain; "Confirm email" decision made
  deliberately for prod (ON for launch — revisit the signup flow copy).
- [ ] Runtime error visibility: at minimum, Vercel log drains reviewed;
  optionally Sentry (decide, don't drift into it).
- [ ] Rollback story: previous deployment re-promotable; schema changes are
  additive-only so old code runs against new schema.
- [ ] Legal minimum: real Privacy + Terms pages linked from the footer
  (hosts store guests' names/emails — privacy policy is not optional).

## Launch QA script (Phase 6 input)

Fresh prod account, desktop + real phone: the five doc-01 use cases, plus
draft→publish, deadline close, image upload, CSV export, password reset,
bulk reminder to a real inbox, tenant isolation re-check with a second
account, and one power-host pass (container nesting + custom code block
still sandboxed in prod). Cross-browser: Chrome, Safari macOS/iOS, Firefox.
