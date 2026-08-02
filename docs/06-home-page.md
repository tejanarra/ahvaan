# 06 — Marketing Home Page Blueprint

Rebuild of `/` (Phase 3). Goal: a portfolio-grade home page whose job is one
conversion — **"Create your event" → signup** — earned by *showing* the
product, not describing it. Everything renders with real product components
(actual themes, actual blocks) so the page doubles as proof.

Tone: warm, editorial stationery — Fraunces display + paper palette (doc 04),
with Stage theme colors appearing only inside the demo vignettes. Single
page, no marketing subpages in v1. Total length ~7 viewports; every section
must survive the "would a host scroll past this?" test — if a section only
restates another, cut it.

## Page structure (in order)

### 1. Header (sticky, translucent paper + blur after 8px scroll)
Wordmark left; right: "Sign in" (ghost) + "Get started free" (primary, sm).
That's all — no nav links to nowhere.

### 2. Hero — the interactive invite (the engagement centerpiece)
Two-column at lg (55/45), stacked on mobile.
- **Left**: eyebrow caption ("Free forever · No guest accounts", small-caps
  signature style), `text-display` headline: **"Design the *invitation*.
  Share one link. Watch the RSVPs arrive."** (italic accent word per doc 04
  signature move #1) Subline (≤ 2 lines): "Ahvaan gives every event a
  beautiful, fully-customizable page — with built-in RSVPs your guests can
  answer in seconds." CTAs: primary lg "Create your event", ghost "See how
  it works ↓" (smooth-scrolls to §4).
- **Right — the live theme demo**: a real mini invite page (an actual
  `PageRenderer` output for a hardcoded sample event: hero + countdown +
  RSVP form, non-interactive/pointer-events-none, scaled into a phone-shaped
  frame with `--radius-lg` + shadow-modal) with a **theme ToggleGroup**
  beneath it (4–5 theme swatch dots). Clicking a swatch re-themes the entire
  vignette instantly (just swaps the `--t-*` vars + fonts — this is the
  product's actual mechanism, ~zero JS cost). This is the page's one moment
  of motion-forward delight and the fastest possible proof of "themes are
  real". Client component; everything else on the page stays server-rendered.

### 3. Social-proof strip (only if honest)
No fake logos/testimonials ever. V1 substitute: a quiet caption-type line of
true facts: "Unlimited events · Unlimited guests · Every RSVP tracked". If
real usage numbers exist later, they replace it.

### 4. "How it works" — three steps
Three cards in a row (stack on mobile), numbered in Fraunces:
1. **Create & design** — screenshot-style vignette of the page builder
   (styled recreation, not a raw screenshot: block cards + preview).
2. **Invite your guests** — vignette of an invite card with a personal link
   + copy/share/mail icons.
3. **Track every RSVP** — vignette of stat tiles + guest cards.
One sentence each. These vignettes are built from real `ui/` components so
they stay current-looking for free.

### 5. Deep-dive features — alternating rows (the only long section)
Three rows, image/text alternating, 64px rhythm, each pairing one honest
capability with a vignette:
- **"A page builder that's actually yours"** — drag blocks, nest containers,
  size and align anything; custom code for the pixel-perfectionists.
  (Vignette: block list mid-drag.)
- **"An RSVP form you control"** — add meal choices, song requests, anything;
  guests answer on their phone in under a minute. (Vignette: form builder
  next to the phone-framed guest form.)
- **"Invites and reminders, handled"** — personal links per guest, one-click
  email invites, bulk reminders to whoever hasn't answered. (Vignette:
  pending list with the "Email all pending" button.)

### 6. Theme gallery
"Start from a look you love" — grid of all 8 themes as mini invite cards
(real colors + display font sample), each labeled. Hover: 120ms lift
(translateY(-2px)). Not clickable-to-anything in v1 except the signup CTA
below; do not build per-theme pages.

### 7. FAQ (accordion, 5 items max)
Is it really free? (Yes — all of it.) · Do guests need an account? (No —
one tap on their link.) · Can I change my page after sending invites?
(Yes, live.) · What events is it for? (Any.) · Can I edit RSVPs myself?
(Yes.) Native `<details>` styled to system, 180ms reveal.

### 8. Final CTA band
`--surface-sunken` band, Fraunces headline "Your event deserves better than
a group chat.", primary lg CTA, caption "Free · unlimited guests".

### 9. Footer
Wordmark, caption "© Ahvaan", links: Sign in · Sign up. Nothing else in v1
(no dead Privacy/Terms links — add real ones in Phase 5's launch checklist).

## Engagement & quality mechanics
- Above-the-fold must fully render server-side; the theme demo hydrates
  after. LCP target < 1.8s (budget in doc 08); hero vignette images (if any)
  are `next/image` with priority.
- Scroll-reveal: sections fade/rise 8px once, 240ms, IntersectionObserver,
  disabled under `prefers-reduced-motion` — the only scroll effect allowed.
- All copy above is final draft — edit for rhythm during build, but keep
  claims honest and quantifiable-verifiable.
- SEO: `generateMetadata` with title "Ahvaan — Beautiful invitations with
  effortless RSVPs", meta description from the hero subline, OG image
  rendered from a Stage vignette (static PNG generated once, in `/public`).
