# 09 — Brand Identity: The Rename & the Favicon/Mark

## Part A — The rename: Invitely → **Gatherie**

### Why the rename was required (verified by web search, 2026-07-30)
"Invitely" is not ours to use: an **Invitely – Invitation & RSVP app already
exists on both the Apple App Store and Google Play** (fotopix's invitation
card maker), plus same-named GitHub projects — a direct, same-category
collision.

### Naming audit trail (candidates checked and rejected — don't re-propose)
| Candidate | Verdict |
|---|---|
| Invitely | ❌ existing RSVP apps on both app stores |
| Inkvite / Inkvites | ❌ story app + multiple invitation-stationery businesses |
| Fêtely / Fetely | ❌ fetely.io — live digital-invitation competitor |
| Cordially / Cordelle | ❌ Cordially Invited Co, RSVP manager; The Cordelle (Nashville event venue) |
| Merrily / Merrymake(r) | ❌ Merrily Designs stationery, Merrily Events, Merrymake platform |
| Joyfully | ❌ shadowed by/confusable with Joy (withjoy.com), major wedding-RSVP incumbent |
| Fondly / Kindly / Warmly / Gladly | ❌ existing apps/companies |
| Circled | ❌ per host decision: circledapp.com exists + Circle.so SEO shadow |
| Circlet | exact-match clean, but Circle-family shadow — passed over |
| Hostwell / Wellhosted | ❌ hostwell.com/.in/.co/.tech, wellhosted.com all active |
| Big Day | ❌ multiple wedding-planning apps |
| Bunting / Convive | ❌ YC startup + personalization co; multiple Convive apps/brands |
| Soirely | exact-match clean; host passed (too oblique) |

### The name: **Gatherie** *(GATH-er-ee)* — chosen by the host 2026-07-30
- **Meaning**: from *gathering* — the reason every event exists and the
  emotional core of the category — finished with the boutique French *-erie*
  ending (as in *patisserie*, and especially *papeterie*, a stationery
  atelier): **"the place where gatherings are made."** Self-explanatory on
  first hearing, warm, and it names the customer's real desire (people
  together) rather than the mechanism (invites).
- **Uniqueness**: web-searched 2026-07-30 — **zero exact matches**: no app,
  company, product, or active site named "Gatherie" in results. The
  "Gather-" neighborhood is busy (Gather.town, Gatherly.io, GatherUp — all
  adjacent categories), which validates the root; "Gatherie" itself is
  unclaimed and visually/verbally distinct. Before launch (doc 08 checklist):
  confirm `gatherie.com` / `.app` registration and run a USPTO TESS + both
  app-store searches as final legal clearance.
- **Usage rules**: "Gatherie" capitalized in prose; all-lowercase "gatherie"
  only in the wordmark and domain. Never "The Gatherie", never "Gathery".
  Pronunciation hint ("like *patisserie*") may appear once in the marketing
  footer, nowhere else.
- **Voice fit**: tagline forms available to marketing copy — "Gatherie —
  where gatherings are made." / "Every gathering, beautifully answered."
  The doc-06 hero headline stays as-is (it never needed the name).

### Rename scope (executed 2026-07-30)
- All UI strings, `<title>`/metadata, email templates, wordmark usages, the
  guest-page "Made with Gatherie" footer line.
- `package.json` name → `gatherie` (drops the stale `wedding-rsvp`).
- Env/dashboard values when provisioned: `NEXT_PUBLIC_SITE_URL`,
  `RESEND_FROM_EMAIL` (e.g. `rsvp@gatherie.<domain>`), Supabase auth email
  templates.
- **Not renamed**: git branch, folder names, historical `SAAS_PLAN.md`
  entries (history stays truthful), DB identifiers (none encode the brand).

## Part A2 — The second rename: Gatherie → **Ahvan**

### Why (host decision, 2026-07-30)
Not a naming failure of "Gatherie" (it cleared the same audit above) — the
host wanted something more immediately familiar/legible as "this is an RSVP
app," plus a short standalone tagline, and asked for fresh candidates.

### Naming audit trail (candidates checked and rejected this round)
| Candidate | Verdict |
|---|---|
| Freevite | ❌ freevite.app — live, same-pitch competitor ("create event, invite friends, see who's coming") |
| RSVP Studio | ❌ rsvp.studio (Utterly Printable) — live, same-pitch competitor |
| EasyRSVP | ❌ heavily used already: easy-rsvp.com, easyrsvp.net, easyrsvp.email, ez-rsvp.com |
| Guestly | ❌ existing App Store app (invitation/gift tracking) |
| Snapvite | ❌ existing wedding-invitation service + a past iOS app of the same name |
| Gatherly | ❌ several live products, incl. an established virtual-events platform (gatherly.io) |
| Invitely | ❌ (re-checked) a real "Invitely – Invitation & RSVP" app now exists on both app stores — the exact collision doc09 Part A already avoided once |
| Flexinvite | exact-match clean (no live product found) — passed over once the host preferred this word's meaning |
| Avahan | briefly chosen, then corrected by the host to the "Ahvan" spelling (below) — same word, different transliteration |

### The name: **Ahvan** — chosen by the host 2026-07-30
- **Meaning**: a transliteration of the Sanskrit/Hindi word आह्वान (āhvāna) —
  "invitation," "invocation," or "summons" — the product category, stated
  directly, in a word that isn't itself an English dictionary word (harder to
  accidentally collide with than "invite"/"gather"-family names). Pairs
  naturally with the reply-card-and-wax-seal mark (Part B) — didn't require a
  mark change.
- **Known associations, disclosed rather than hidden**: "Ahvan" is also used
  by a small India-based tech-services company (Ahvan Solutions Pvt Ltd /
  ahvan.io) and a couple of small handicraft/fashion shops — none in the
  RSVP/events/invitation category, so no direct competitor collision. (The
  alternate spelling "Avahan" is separately the name of the Bill & Melinda
  Gates Foundation's India AIDS Initiative, 2003–2013 — not this spelling,
  but close enough to be worth knowing.) Accepted knowingly by the host for a
  personal project; revisit before any serious commercial launch/paid
  marketing spend.
- **Tagline**: "Ahvan — RSVP made easy" — used in `<title>`/meta description
  and the marketing hero; conveys the free/easy/customizable pitch this round
  of naming was optimizing for, which the name alone doesn't carry.
- **Usage rules**: "Ahvan" capitalized in prose; the wordmark itself is
  uppercase "AHVAN" (host preference, overriding the lowercase-wordmark
  convention Gatherie used) — see `components/brand.tsx`.

### Rename scope (executed 2026-07-30)
Same surface as Part A's rename: all UI strings, `<title>`/metadata, email
templates, wordmark usage (`components/brand.tsx`), the guest-page "Made with
Ahvan" footer line, `package.json` name. **Not renamed**: git branch, folder
names (this worktree stays `RSVP-saas`), historical `SAAS_PLAN.md` entries,
DB identifiers. The brand *mark* (Part B) is unchanged — only the wordmark
text and name-dependent copy moved from "gatherie" to "ahvan".

## Part B — The brand mark & favicon

### Concept: **the tilted reply card**
One idea, drawn once, used everywhere: a stationery **reply card tilted 8°**
(the moment an invitation is handed to you), carrying a single **accent-green
wax-seal dot** at its lower-right — the RSVP made visible. It encodes both
halves of the product (beautiful invitation + tracked reply) in two shapes,
and survives at 16px because it is only two shapes. The stationery object
also anchors the *-erie* / papeterie idea of the name.

### Geometry spec (author as a single SVG, 24×24 viewBox)
- Card: rounded rectangle ~15×11 units, corner radius 2.5, rotated **−8°**
  about its center, centered optically (nudged 0.5 up-left to counter the
  tilt's visual weight).
- Seal dot: circle r=2.6, centered on the card's lower-right corner region
  (overlapping the edge by ~1/3 — sitting *on* the card like a wax seal).
- Stroke construction for chrome contexts: card outlined at 1.75 stroke,
  `currentColor`, dot filled — this is the in-app/wordmark variant.
- Filled construction for the favicon: card filled solid, dot knocked out or
  contrast-filled (see color recipes below).
- The mark must read cleanly with no other detail — no envelope flap, no
  lines of "text" on the card, no gradients ever.

### Color recipes
| Context | Card | Dot | Background |
|---|---|---|---|
| Favicon (light UAs) | ink `#211E19` | accent `#2F5D46` | transparent |
| Favicon (dark UAs) | paper `#FBFAF8` | sage `#7FB394` (accent-soft was too pale at 16px) | transparent |
| App icons (apple/android) | paper `#FBFAF8` filled card | accent dot | full-bleed ink `#211E19` rounded square |
| In-app wordmark lockup | `currentColor` stroke | accent fill | inherits |
| OG image corner | paper card | accent dot | ink band |

### Deliverables — items 1–3 and 5 BUILT 2026-07-30 (ahead of Phase 1, per host request); only `public/og.png` (item 4) remains for Phase 3
1. `src/app/icon.svg` — the master favicon: hand-authored SVG (< 1KB) with a
   `prefers-color-scheme: dark` `<style>` block inside the SVG switching the
   two favicon recipes. Next.js serves SVG favicons directly; modern
   browsers get crisp, theme-aware tabs for free.
2. `src/app/icon.png` — 512×512 raster export of the app-icon recipe
   (fallback for UAs that skip SVG), plus `favicon.ico` (32+16 px, ink-on-
   transparent; the dot may simplify to a plain accent square at 16px if the
   circle muddies — check at actual size).
3. `src/app/apple-icon.png` — 180×180 app-icon recipe (full-bleed ink
   square; iOS applies its own corner mask — leave 12% safe margin).
4. `public/og.png` — 1200×630 per doc 06 (Stage vignette + the lockup).
5. The wordmark lockup component (`components/brand.tsx`): mark + "AHVAN"
   in the display serif (Fraunces, uppercase — host preference, WONK 1,
   −0.02em tracking), mark sized to the x-height ×1.6, 8px gap. Used in
   Studio header, auth pages, marketing header/footer, email header.

### Favicon quality bar (gate items, folded into Phase 1's gate)
- Legible and recognizable at real 16px in a browser tab next to Gmail/
  GitHub tabs (screenshot evidence), in both light and dark tab themes.
- The tilt survives rasterization (no half-pixel blur: snap the un-rotated
  card to the pixel grid before applying rotation; export with 2× padding
  trimmed).
- Pinned-tab/monochrome contexts degrade to pure `currentColor` (the SVG
  uses no hardcoded fill when `forced-colors: active`).
- All five deliverables ship together — no session leaves the old wedding
  favicon alongside the new brand anywhere.

## Part C — Where this doc plugs in
The rename is already propagated through docs 01–08, `CLAUDE.md`, and
project memory ("Ahvan, formerly Gatherie, formerly Invitely" appears only
here). Doc 04's
brand-foundation section defers to this doc for the mark's geometry; doc 07
Phase 1 includes "execute doc 09 Parts A+B" as its first work item; doc 08's
launch checklist includes the final name-clearance and domain items from
Part A.
