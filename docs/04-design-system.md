# 04 — Design System: Theory & Specification

A totally custom design language for Ahvaan, replacing the current
generic zinc-plus-indigo utility styling. This doc is the **single source of
truth for every visual decision**. If it's not here, it doesn't ship; extend
this doc first.

## Design theory

### The one governing idea: **Studio & Stage**

Ahvaan is two products wearing one brand:

- **The Studio** — the host dashboard. A *tool*. Its job is to make the
  host's content the loudest thing on screen. Theory: calm, dense-but-airy,
  monochrome-plus-one-accent, fast-feeling. The Studio never competes with
  the invitation it's editing — like a photo editor's dark chrome around a
  photo, our chrome is quiet paper around the invite.
- **The Stage** — the guest-facing event page and the marketing site's
  previews. *Expressive*. Theme-driven color, display typography, generous
  whitespace, a sense of occasion. This is where beauty budget is spent.

Every design decision gets tested against: *does this make the host's
invitation feel more important, or the app?* The app loses that contest on
purpose, everywhere except the marketing home page (doc 06), where the app
itself is briefly the product on stage.

### Principles (in priority order)
1. **Content is the interface.** Real event titles, real theme colors, and
   live previews wherever possible — never gray abstractions of them.
2. **One way to do each thing.** Mirrors the product's no-redundancy rule:
   one accent, one radius family, one control vocabulary reused everywhere
   (the Style panel, the toggle group, the icon button).
3. **Quietly premium.** Quality signaled through spacing rhythm, type
   hierarchy, and micro-motion — not gradients, glass, or decoration in the
   Studio.
4. **Guest pages are sacred ground.** Studio tokens never leak into
   `/e/[slug]`; the Stage renders only from theme tokens (`--t-*`).
5. **Accessible by default.** Every token pair ships with a checked contrast
   ratio (≥ 4.5:1 body text, ≥ 3:1 large text/UI); focus states are designed,
   not default.

## Brand foundation

- **Name/wordmark**: “ahvaan” set in the display serif (see Typography),
  all-lowercase, −0.02em tracking, the final “e” carrying Fraunces's WONK-axis
  letterform, preceded by the mark: a tilted rounded-rectangle “reply card”
  glyph with a wax-seal dot (full geometry in doc 09). (SVG, currentColor —
  so it works in any theme.) In running prose the name is capitalized:
  Ahvaan.
- **Voice**: warm, brief, second-person. “Your guests”, “Share your page”.
  Never exclamation-mark enthusiasm; never enterprise jargon.

### Signature style moves (what makes Ahvaan look like *only* Ahvaan)

The aesthetic is **modern stationery**: editorial serif elegance on warm
paper, executed with tool-grade restraint. Five recurring signatures, used
consistently so the product is recognizable at a glance:

1. **The italic accent word.** In every display-size headline, exactly one
   emphasis word is set in the display serif's *italic* (“Design the
   *invitation*.”, “Plan something *lovely*”). Never more than one per
   headline; never in body text or UI controls.
2. **Hairline rules.** 1px `--border` horizontal rules with generous
   breathing room (24px+) separate sections instead of boxes-within-boxes —
   the page reads like a well-set menu or program, not a grid of panels.
3. **Letterspaced small caps captions.** All eyebrow labels, panel headers,
   and badges use the caption token: 11–12px, uppercase, +0.08em tracking,
   muted ink. This is the “engraved stationery” detail carried everywhere.
4. **The swatch strip.** A 6px theme-gradient strip (accent→accentDark) is
   the persistent motif representing “an event” — on dashboard cards, the
   theme picker, marketing vignettes. Color always belongs to the *event*,
   never to the chrome.
5. **Ink, not gray.** Neutral tones are all warm (paper/ink family); pure
   grays and pure white/black are banned outside guest themes that call for
   them. This alone separates the Studio from every gray SaaS dashboard.

## Color

### Studio palette (replaces current zinc/indigo)

Warm-neutral “paper & ink” scale plus a single signature accent.

```css
:root {
  /* paper (warm neutral, replaces zinc) */
  --background:      #FBFAF8;  /* warm paper, not pure white */
  --surface:         #FFFFFF;  /* cards float slightly brighter than bg */
  --surface-sunken:  #F4F2EE;  /* wells, code areas, canvas backdrop */
  --surface-hover:   #F1EFEA;
  --border:          #E7E4DD;
  --border-strong:   #D5D1C7;
  /* ink */
  --foreground:      #211E19;
  --muted:           #6E6A61;
  --muted-foreground:#A3A099;  /* placeholders/disabled only, never body */
  /* signature accent — deep editorial green */
  --accent:          #2F5D46;
  --accent-hover:    #264C39;
  --accent-soft:     #E8F0EB;  /* selected states, badges, tints */
  --accent-foreground:#FFFFFF;
  /* semantic */
  --destructive:     #B3452F;  --destructive-hover: #983A27;
  --success:         #2F6B4F;  --warning: #8F631A;
}
```

Rationale: warm paper + ink evokes stationery (the product's subject) and
guarantees any guest theme (gold, pastel, navy…) looks vivid inside it. The
deep green accent is distinctive (every RSVP tool is indigo/blue), reads
"considered/stationery", and passes 4.5:1 on both `--background` and
`--surface`. Semantic colors are desaturated to sit in the same warm family.

Dark mode: **deferred** for the Studio (not in v1). Do not half-ship it.

### Stage (guest theme) system — expanded in Phase 2

Themes grow from 4 color-only presets to **8 full presets**, each defining
colors + typography + optional texture:

```
Theme = { id, label, description,
  colors: { background, foreground, accent, accentDark, surface },
  fonts:  { display: string; body: string },   /* next/font loaded pairs */
  texture?: "none" | "grain" | "linen"          /* subtle bg overlay */ }
```

The 8 presets (existing 4 keep their ids/colors, gain fonts):

| Theme | Palette | Display / Body | Mood |
|---|---|---|---|
| Classic Gold *(existing)* | amber on warm ivory | Cormorant Garamond / Source Sans 3 | traditional wedding |
| Modern Minimal *(existing)* | ink on white | Archivo / Inter | gallery-clean |
| Playful Pastel *(existing)* | rose on blush | Quicksand / Nunito Sans | birthdays, showers |
| Midnight Elegant *(existing)* | silver on navy | Marcellus / Figtree | black-tie |
| Garden Party *(new)* | sage & terracotta on cream | Lora / Karla | outdoor, brunch |
| Ocean Air *(new)* | dusty blue on off-white | Libre Baskerville / Lato | coastal, calm |
| Fiesta *(new)* | saturated coral/marigold on warm white | Bricolage Grotesque / Inter | loud parties |
| Ink & Blush *(new)* | charcoal + blush accent on white | Playfair Display / Mulish | editorial, chic |

Fonts load via `next/font/google` **only on Stage routes** (subset latin,
`display: swap`); the Studio never pays for them except inside the builder
preview. `resolveThemeColors` generalizes to `resolveTheme` (colors + fonts +
texture) and keeps the override mechanism; `themeOverrides` gains nothing new.
Existing events with the 4 old ids render identically in color and simply
gain their theme's fonts — visually strictly better, no migration.

Stage CSS custom properties: existing `--t-bg/fg/accent/accent-dark/surface`
plus `--t-font-display`, `--t-font-body`. Blocks use display for
headings/hero, body for everything else.

## Typography

A deliberately *un-generic* pairing — no Inter, no Geist, no system stack.
Both faces load via `next/font/google` (variable, latin subset, swap):

- **Display serif — “Fraunces”** (variable: weight + optical size + SOFT/
  WONK axes). The brand's voice: a warm, high-personality old-style serif
  whose optical-size axis gives true display elegance at 40px+ and a
  characterful *italic* for the signature accent word. Tuned, not default:
  display sizes use `"opsz" 72` with SOFT ~50 for rounded, engraved warmth;
  the wordmark uses WONK 1 for the quirky letterforms (nowhere else). This
  tuning is the uniqueness — nobody else's Fraunces looks like this one.
  Used for: wordmark, marketing + auth headlines, page titles, empty-state
  titles, stat numerals. Never below 20px.
- **UI face — “Hanken Grotesk”** (variable). An elegant humanist grotesk
  with subtly calligraphic terminals — warmer and far less ubiquitous than
  Inter, yet just as legible at 13px. Used for everything else in the
  Studio. Set body text at weight 430 (variable axis), headings 620 —
  off-standard weights are part of the refined feel.

If a face must be swapped for any reason, the replacement must preserve the
contrast pattern: high-personality serif display + warm grotesk UI. Never
substitute a neutral tech sans for either role.

Type scale (Studio, rem, 1.2 ratio — use these only):

| Token | Size/leading | Face | Use |
|---|---|---|---|
| `text-display` | 44/48, −0.01em | Fraunces 560, opsz 72 | marketing hero, auth headline |
| `text-title` | 24/30 | Fraunces 540, opsz 40 | page titles |
| `text-heading` | 18/26 | Hanken 620 | section/card headings |
| `text-body` | 14/22 | Hanken 430 | default UI text |
| `text-small` | 13/18 | Hanken 430 | secondary, table meta |
| `text-caption` | 12/16, uppercase, +0.08em | Hanken 560, muted | labels, badges, eyebrows (small-caps signature) |

Rules: no font sizes outside the scale; one italic accent word max per
display headline (signature move #1); stat numerals in Fraunces with
`font-variant-numeric: tabular-nums`; line length in prose ≤ 65ch.

## Space, shape, elevation

- **Spacing**: 4px base grid. Allowed steps: 4, 8, 12, 16, 24, 32, 48, 64.
  Section rhythm in the Studio: 24 inside cards, 32 between page sections.
- **Radius**: `--radius-sm: 6px` (inputs, buttons), `--radius-md: 10px`
  (cards, panels), `--radius-lg: 16px` (modals, marketing), full (pills,
  avatars). Never mix radii on siblings.
- **Elevation**: borders are the primary separator (flat design);
  shadows only for *floating* things:
  `--shadow-pop: 0 4px 16px rgb(33 30 25 / 0.10)` (dropdowns, popovers),
  `--shadow-modal: 0 12px 40px rgb(33 30 25 / 0.16)`. Cards get border only.
- **Focus**: 2px ring `--accent` at 40% + 1px offset, on `:focus-visible`
  everywhere (already partially built into Button — extend to all
  interactives via a shared class).

## Motion

Purposeful, tiny, interruptible. Tokens: `--ease-out: cubic-bezier(.2,.8,.2,1)`;
durations 120ms (hover/press), 180ms (reveal: dropdown, accordion, tab
underline), 240ms (modal/drawer). Rules: transition `opacity`/`transform`
only; modals scale 0.98→1 + fade; block-card expand animates height via grid
rows trick; drag uses dnd-kit defaults; respect
`prefers-reduced-motion: reduce` (drop transforms, keep opacity). No
scroll-jacking, no parallax, marketing included (one exception in doc 06).

## Component specifications (`src/components/ui/`)

Existing primitives are kept and re-skinned to tokens above; gaps to add are
marked **new**.

- **Button** — variants primary (accent bg), secondary (surface + border),
  ghost, destructive; drop `outline` (redundant with secondary — consolidate
  usages). Heights 32/36/40. Loading spinner as built.
- **Input / Textarea / Select** — 36px, `--radius-sm`, border→
  `--border-strong` on hover, accent ring on focus; error state: destructive
  border + 12px caption below. Labels: `text-caption`, muted, 6px gap.
- **Card** — surface bg, border, `--radius-md`, no shadow; optional header
  row pattern (heading left, actions right, 16px padding, divider).
- **Tabs** — underline style: 2px accent underline slides (180ms) under the
  active item; inactive muted → foreground on hover. Used for event nav.
- **ToggleGroup** — segmented control on `--surface-sunken`, active segment
  gets surface bg + border + text-foreground. This is THE control for small
  exclusive choices (align, width, S/M/L) — never radio-button rows in the
  Studio.
- **Badge** — soft tints: accent-soft/green, warning, destructive at 12% bg;
  caption type. Used for status (Draft/Published), counts, roles.
- **Modal** — centered, `--radius-lg`, `--shadow-modal`, backdrop
  `rgb(33 30 25 / 0.4)`; mobile: bottom-sheet (slides up, full width).
- **StatTile** — number in `text-title` tabular, label in caption; clickable
  variant shows accent underline on hover (existing behavior).
- **EmptyState** — Fraunces title, muted body ≤ 50ch, one primary action;
  optional small illustration (single-color line style, accent).
- **Toast** **(new)** — bottom-center, surface + border + shadow-pop, 4s
  auto-dismiss; replaces ad-hoc inline "Saved"/sent-state text for
  transient confirmations. One `<Toaster/>` in the Studio layout; tiny
  custom implementation (no dependency).
- **Dropdown menu** **(new)** — for card overflow actions (Manage/Duplicate?
  no — Manage/Delete) and future needs; shadow-pop, 180ms.
- **Skeleton** **(new)** — `--surface-sunken` shimmer blocks for `loading.tsx`
  files (Phase 5).
- **Tooltip** **(new)** — caption text on foreground-colored bubble; icon
  buttons must all have one (a11y).

### Builder-specific vocabulary (components/builder/)
The Style panel, block cards, palette, and property rows all compose from the
primitives above; the only bespoke pieces are: **PanelSection** (collapsible,
caption-type header, chevron 180ms), **PropertyRow** (label left 120px,
control right), and the **canvas backdrop** (`--surface-sunken` with a subtle
dotted grid so the previewed page reads as an artboard).

## Iconography

Keep the hand-rolled `icons.tsx` approach (1.5px stroke, 24px grid,
currentColor) — it's consistent and dependency-free. Rules: 16px in buttons/
rows, 20px standalone; every icon-only button gets `aria-label` + Tooltip.
Audit existing icons to one stroke weight during Phase 1.

## Accessibility bars (checked at every phase gate)
- Token pairs pass WCAG AA (verify once in Phase 1 with a script, then only
  when tokens change).
- Full keyboard path: tab order, focus-visible, Esc closes modals/menus,
  arrow keys in ToggleGroup/Tabs.
- dnd-kit keyboard sensor enabled in both builders + screen-reader
  announcements for reorder.
- Forms: labels tied to inputs, errors announced via `aria-live`.
