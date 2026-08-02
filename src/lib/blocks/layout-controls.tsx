import type { CSSProperties } from "react";
import type { BlockAlign, BlockLayout, BreakpointOverride } from "./types";
import { BLOCK_WIDTH_PX, MOBILE_MAX_PX, TABLET_MAX_PX, resolveBlockLayout } from "./types";

const ALIGN_TO_MARGIN: Record<BlockAlign, Pick<CSSProperties, "marginLeft" | "marginRight">> = {
  left: { marginLeft: 0, marginRight: "auto" },
  center: { marginLeft: "auto", marginRight: "auto" },
  right: { marginLeft: "auto", marginRight: 0 },
};

const ALIGN_TO_JUSTIFY: Record<BlockAlign, CSSProperties["justifyContent"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const ALIGN_TO_TEXT: Record<BlockAlign, CSSProperties["textAlign"]> = {
  left: "left",
  center: "center",
  right: "right",
};

// Parses "prop: value; prop2: value2" into a React inline-style object —
// deliberately not a full CSS parser (no selectors, no nesting, no at-rules)
// so a host's "Custom CSS" field can only style the one element it's
// attached to, never anything else on the page.
// Host-authored CSS values, not selectors — this can only ever style the
// one wrapper box it's attached to (docs/02, docs/08 "sandbox invariants").
// `url(...)` (external resource loads — tracking pixels, and historically
// a vector for `url(javascript:...)`) and `expression(...)` (old IE's
// arbitrary-JS-in-CSS mechanism) are rejected outright rather than
// sanitized — a value that needs either isn't a legitimate layout tweak,
// so the whole declaration is dropped instead of guessing at a safe subset.
const UNSAFE_VALUE_PATTERN = /url\s*\(|expression\s*\(/i;

export function parseInlineStyle(text: string | undefined): CSSProperties {
  if (!text) return {};
  const style: Record<string, string> = {};
  for (const rule of text.split(";")) {
    const idx = rule.indexOf(":");
    if (idx === -1) continue;
    const prop = rule.slice(0, idx).trim();
    const value = rule.slice(idx + 1).trim();
    if (!prop || !value) continue;
    if (UNSAFE_VALUE_PATTERN.test(value)) continue;
    // A CSS custom property (e.g. schedule.tsx's --schedule-dot-color) must
    // keep its literal, case-sensitive `--` name — the kebab→camelCase
    // conversion below is only correct for real CSS properties (border-radius
    // → borderRadius) and would otherwise mangle "--schedule-dot-color" into
    // "-ScheduleDotColor", silently breaking every custom-property hook a
    // block exposes this way.
    const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[key] = value;
  }
  return style as CSSProperties;
}

// The style applied to the wrapper page-renderer.tsx puts around every
// block's own Render output. Three independent jobs happen here, all needed:
// 1. `margin` positions this wrapper *box* within the page (deliberately
//    margin-auto rather than flex `align-self` — align-self combined with
//    an explicit width resolves against an ambiguous reference size in some
//    browsers, which visibly shifted "centered" blocks off-center).
// 2. `display: flex` + `justifyContent` positions the block's own *content*
//    within this box, for blocks (rsvp-form, venue-map) that keep their own
//    smaller internal max-width regardless of the chosen width preset —
//    without this, picking a wider preset just exposed empty space to the
//    content's right (flow layout default), which looked like "changing
//    size changes alignment." Harmless no-op for blocks that are `w-full`
//    internally (hero/text/image/etc.), since a 100%-width flex child
//    leaves nothing for justify-content to move.
// 3. `customCss` — the host's own free-form CSS for this one block, parsed
//    via `parseInlineStyle` and spread last so it can override any of the
//    above (e.g. a host setting their own `text-align`) if they want to.
//
// `parentLayoutMode` is passed by the recursive renderer when this block is
// a container's *child*: a plain vertical page flow (or a "column"/"grid"
// container) wants every child to be `width: 100%` of its box (that's what
// makes "centered up to a max-width" work) — but inside a "row" container,
// forcing every child to 100% width makes each one claim the whole row by
// itself, so nothing ever actually sits side-by-side no matter how many
// children there are. Row children instead default to an equal proportional
// *share* of the row (like "3 even columns") via `flexGrow` (see
// BlockLayout) — unset behaves as a share of 1, same as every sibling that
// also hasn't set one, so a fresh row splits evenly with zero configuration.
// A different positive number gives that child a bigger/smaller ratio (e.g.
// 2/1/1 across three children); an explicit 0 is the deliberate opt-out back
// to "size to my own content" (up to the Width preset as a cap), for hosts
// who want content-sized columns instead of even ones. `gridSpan` is the
// grid-mode equivalent: how many grid columns this one child occupies.
//
// This file stays server-safe (no hooks/client components) since
// page-renderer.tsx (a Server Component) imports it for the public guest
// page — the interactive `<LayoutControls>` editor UI lives in
// `layout-controls-ui.tsx` instead, a client-only sibling.
export function layoutWrapperStyle(
  layout: Partial<BlockLayout> | undefined,
  parentLayoutMode?: "column" | "row" | "grid"
): CSSProperties {
  const resolved = resolveBlockLayout(layout);
  const inRow = parentLayoutMode === "row";
  const inGrid = parentLayoutMode === "grid";
  // Unset defaults to an equal share so a fresh row splits evenly with no
  // configuration; an explicit 0 opts back out to content-sized (see the
  // comment above and the Row share field in layout-controls-ui.tsx).
  //
  // Both the explicit-ratio and default-share cases use flexBasis: 0% (not
  // "auto") — every block type's own Render output is `w-full` internally
  // (hero/text/image/container/etc. — see e.g. container.tsx), and
  // flexBasis: auto on THIS wrapper would defer its sizing to that `w-full`
  // *descendant*, which in turn depends on this wrapper's own (not-yet-
  // resolved) size — a circular dependency that real browsers resolve by
  // just making the item claim the entire line, so every row child ended up
  // one-per-line regardless of how many would actually fit. flexBasis: 0%
  // sidesteps the circularity entirely (it's a definite value, not derived
  // from content), and pairing it with an explicit `minWidth` is what still
  // gets correct multi-column wrapping: flex-wrap's line-breaking respects
  // minWidth as a floor once items can't shrink further, so a row keeps
  // adding equally-shared columns until they'd have to shrink below that
  // floor, then wraps — instead of either ignoring child count entirely
  // (the w-full bug) or refusing to wrap until content is literally 0-width.
  const explicitRowShare = inRow && Boolean(resolved.flexGrow && resolved.flexGrow > 0);
  const defaultRowShare = inRow && resolved.flexGrow === undefined;
  const hasRowRatio = explicitRowShare || defaultRowShare;

  return {
    display: "flex",
    justifyContent: ALIGN_TO_JUSTIFY[resolved.align],
    width: inRow && !hasRowRatio ? "auto" : "100%",
    ...(explicitRowShare
      ? { flex: `${resolved.flexGrow} 1 0%` }
      : defaultRowShare
        ? { flex: "1 1 0%", minWidth: "200px" }
        : {}),
    ...(inGrid && resolved.gridSpan && resolved.gridSpan > 1 ? { gridColumn: `span ${resolved.gridSpan}` } : {}),
    // Grid items default to an "automatic minimum size" driven by their own
    // content (same mechanism as flex's implicit min-width), so a track
    // capped at minmax(0, 1fr) (container.tsx) still didn't stop unbreakable
    // content (e.g. a long word) from overflowing the item past its column —
    // minWidth: 0 here is what actually lets it shrink to (and wrap/clip
    // within) the track's share.
    ...(inGrid ? { minWidth: 0 } : {}),
    maxWidth: hasRowRatio || inGrid ? undefined : resolved.width === "full" ? "none" : `${BLOCK_WIDTH_PX[resolved.width]}px`,
    minHeight: resolved.minHeightPx && resolved.minHeightPx > 0 ? `${Math.min(resolved.minHeightPx, 4000)}px` : undefined,
    ...(inRow || inGrid ? {} : ALIGN_TO_MARGIN[resolved.align]),
    textAlign: ALIGN_TO_TEXT[resolved.align],
    // Redefines the --t-fg custom property for this block and everything
    // inside it — see BlockLayout.textColorOverride for why this, and not
    // a plain `color`, is what actually changes visible text.
    ...(resolved.textColorOverride ? { "--t-fg": resolved.textColorOverride } : {}),
    ...parseInlineStyle(resolved.customCss),
  } as CSSProperties;
}

// `!important` on every declaration is load-bearing, not decoration: the
// same wrapper div also carries an inline `style={layoutWrapperStyle(...)}`
// (page-renderer.tsx) with its own max-width/margin/justify-content/
// text-align always set — an inline `style` attribute beats any stylesheet
// rule regardless of selector specificity *except* `!important`, so without
// it every one of these media-query rules would be silently overridden and
// do nothing.
const ALIGN_TO_MARGIN_CSS: Record<BlockAlign, string> = {
  left: "margin-left: 0 !important; margin-right: auto !important;",
  center: "margin-left: auto !important; margin-right: auto !important;",
  right: "margin-left: auto !important; margin-right: 0 !important;",
};

const ALIGN_TO_JUSTIFY_CSS: Record<BlockAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

function breakpointDeclarations(override: BreakpointOverride): string {
  if (override.hidden) return "display: none !important;";
  const decls: string[] = [];
  if (override.width) {
    const maxWidth = override.width === "full" ? "none" : `${BLOCK_WIDTH_PX[override.width]}px`;
    decls.push(`max-width: ${maxWidth} !important;`);
  }
  if (override.align) {
    decls.push(ALIGN_TO_MARGIN_CSS[override.align]);
    decls.push(`text-align: ${override.align} !important;`);
    // justify-content positions a block's own *content* within its box
    // (layoutWrapperStyle's job 2 — matters for blocks like rsvp-form/
    // venue-map that keep a smaller internal max-width regardless of the
    // wrapper's width preset), so an align override needs to move this too,
    // not just the box's own margins.
    decls.push(`justify-content: ${ALIGN_TO_JUSTIFY_CSS[override.align]} !important;`);
  }
  return decls.join(" ");
}

// Real `@media` CSS for one block's mobile/tablet overrides. Every value
// here comes from a validated enum (page-schema.ts's blockLayoutSchema) or
// this app's own generated block id (crypto.randomUUID()) — never
// host-authored free text — so interpolating straight into a `<style>` tag
// (page-renderer.tsx) carries no injection risk, unlike parseInlineStyle's
// customCss above which exists specifically to fence in untrusted text.
//
// Only used for the real guest page: the server can't know a visitor's
// viewport ahead of render, so this has to be real responsive CSS. The
// builder's own canvas instead swaps the effective layout directly based on
// its explicit device-toggle state (editable-canvas.tsx) — a `@media` query
// would evaluate against the actual browser window, not the canvas's
// simulated device width, so it wouldn't preview correctly there anyway.
export function blockResponsiveCss(blockId: string, layout: BlockLayout | undefined): string {
  if (!layout?.mobile && !layout?.tablet && !layout?.hiddenOnDesktop) return "";
  const selector = `[data-block-id="${blockId}"]`;
  const rules: string[] = [];

  if (layout.hiddenOnDesktop) {
    rules.push(`@media (min-width: ${TABLET_MAX_PX + 1}px) { ${selector} { display: none !important; } }`);
  }
  if (layout.mobile) {
    const decls = breakpointDeclarations(layout.mobile);
    if (decls) rules.push(`@media (max-width: ${MOBILE_MAX_PX}px) { ${selector} { ${decls} } }`);
  }
  if (layout.tablet || layout.mobile) {
    // Field-by-field merge, not "use tablet if the whole object is set,
    // else mobile": a tablet field that IS set always wins, but any field a
    // host left unset on tablet falls back to the *mobile* override rather
    // than the desktop base layout. This range (768-1023px — a tablet held
    // "short side down", portrait) is meant to default to looking like
    // mobile with zero configuration, the same way landscape tablets
    // (1024px+, "long side down") already default to looking like desktop
    // with zero configuration (they're outside this media query entirely) —
    // so a host only has to set "hide on mobile" (say) once and it covers
    // phones and portrait tablets both, instead of needing an identical
    // duplicate tablet override.
    //
    // `hidden` is deliberately excluded from the blanket field-by-field
    // merge above and handled on its own: unchecking "hide" in the editor
    // sets the field back to `undefined`, not `false` (see
    // layout-controls-ui.tsx's BreakpointOverrideFields), so there's no way
    // to represent "explicitly visible on tablet" distinctly from "never
    // configured" for that one field. Falling back to mobile's `hidden`
    // whenever *any* tablet override exists — even a host who only set a
    // tablet Width — silently re-hid it with no way to undo that from the
    // UI. Falling back only when the tablet object doesn't exist at all
    // keeps the zero-config case working (unset tablet still mirrors
    // mobile, hidden included) while a host who's touched tablet at all
    // keeps its own (possibly unset-meaning-visible) hidden state.
    const effectiveTablet: BreakpointOverride = {
      hidden: layout.tablet ? layout.tablet.hidden : layout.mobile?.hidden,
      align: layout.tablet?.align ?? layout.mobile?.align,
      width: layout.tablet?.width ?? layout.mobile?.width,
    };
    const decls = breakpointDeclarations(effectiveTablet);
    if (decls) {
      rules.push(
        `@media (min-width: ${MOBILE_MAX_PX + 1}px) and (max-width: ${TABLET_MAX_PX}px) { ${selector} { ${decls} } }`
      );
    }
  }
  return rules.join("\n");
}
