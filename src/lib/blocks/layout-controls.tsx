import type { CSSProperties } from "react";
import type { BlockAlign, BlockLayout } from "./types";
import { BLOCK_WIDTH_PX, resolveBlockLayout } from "./types";

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
export function parseInlineStyle(text: string | undefined): CSSProperties {
  if (!text) return {};
  const style: Record<string, string> = {};
  for (const rule of text.split(";")) {
    const idx = rule.indexOf(":");
    if (idx === -1) continue;
    const prop = rule.slice(0, idx).trim();
    const value = rule.slice(idx + 1).trim();
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[camel] = value;
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
// children there are. Row children instead size to their own content (up to
// their width preset as a cap), which is what lets them sit next to each
// other and wrap only when they don't fit — unless `flexGrow` is set (see
// BlockLayout), in which case the child instead takes a proportional *share*
// of the row (e.g. 2/1/1 across three children), same idea as CSS
// `flex-grow`, for hosts who want deliberate column ratios rather than
// content-sized columns. `gridSpan` is the grid-mode equivalent: how many
// grid columns this one child occupies.
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
  const hasRowRatio = inRow && resolved.flexGrow && resolved.flexGrow > 0;

  return {
    display: "flex",
    justifyContent: ALIGN_TO_JUSTIFY[resolved.align],
    width: inRow && !hasRowRatio ? "auto" : "100%",
    // A ratio turns this from "size to my own content" into "take this share
    // of the row's remaining space" — flexBasis: 0 is what makes flex-grow
    // distribute proportionally rather than starting from content size.
    ...(hasRowRatio ? { flex: `${resolved.flexGrow} 1 0%` } : {}),
    ...(inGrid && resolved.gridSpan && resolved.gridSpan > 1 ? { gridColumn: `span ${resolved.gridSpan}` } : {}),
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
