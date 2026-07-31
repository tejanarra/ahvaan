import type { ThemeColorOverrides } from "@/lib/themes";

// Generic sizing/alignment applied uniformly to every block by the renderer
// (see page-renderer.tsx) — a block's own Render component never needs to
// know about this, it just gets wrapped.
export type BlockAlign = "left" | "center" | "right";
export type BlockWidth = "small" | "medium" | "large" | "full";

export type BlockLayout = {
  align: BlockAlign;
  width: BlockWidth;
  // Optional minimum height in px, applied to the shared wrapper — "minimum"
  // rather than a hard cap so taller content (e.g. a long RSVP form) is
  // never clipped, it just never renders shorter than this.
  minHeightPx?: number;
  // A plain `color:` in customCss below can never actually change visible
  // text — every block's own text elements set their own explicit
  // `color: var(--t-fg)` (etc.), which is more specific than the wrapper's
  // inherited color and always wins. `--t-fg` is a CSS *custom property*
  // though, and those DO cascade normally — redefining it here overrides it
  // for every descendant that references `var(--t-fg)`, with no block file
  // needing to change. That's what this field does instead of `color`.
  textColorOverride?: string;
  // Raw "prop: value; prop2: value2" text, parsed into an inline style
  // object (see layout-controls.tsx's parseInlineStyle) and applied to the
  // shared wrapper div every block is rendered inside — this is what gives
  // every block type custom CSS, not just the container block, without
  // needing a per-block config field. Same safety model as the container's
  // customStyle: no selectors, no <style> tag, so it can only ever affect
  // this one block's own box.
  customCss?: string;
  // Only meaningful when this block is a direct child of a "row" container —
  // a relative size ratio among siblings (e.g. 2/1/1 gives the first child
  // half the row, the other two a quarter each), same idea as CSS flex-grow.
  // Ignored (and hidden in the editor) for top-level blocks or "column"/
  // "grid" containers.
  flexGrow?: number;
  // Only meaningful when this block is a direct child of a "grid" container —
  // how many grid columns this element spans (e.g. 2 of 4 columns = half
  // width). Ignored (and hidden in the editor) otherwise.
  gridSpan?: number;
  // Hides this block on desktop specifically (>= lg, see TABLET_MAX_PX)
  // while leaving mobile/tablet alone — the desktop-side equivalent of
  // `mobile.hidden`/`tablet.hidden` below. Named distinctly from those
  // (not just `hidden`) because the base align/width fields already *are*
  // "the desktop layout" — a plain `hidden` here would be ambiguous
  // between "hidden on desktop" and "hidden everywhere."
  hiddenOnDesktop?: boolean;
  // Per-device overrides: unset fields on either fall back to the base
  // align/width above (which is what "desktop" always means — there is no
  // separate desktop override object, the base fields *are* the desktop
  // layout; `hiddenOnDesktop` above is desktop's one exception). `hidden`
  // on its own lets a block be dropped from one device entirely without
  // touching the others. Real guest page: enforced via real `@media` CSS
  // (see layout-controls.tsx's blockResponsiveCss) since the server can't
  // know a visitor's viewport ahead of render. Builder canvas: enforced via
  // the explicit device-toggle state instead (see editable-canvas.tsx) — a
  // real `@media` query would evaluate against the actual browser window,
  // not the canvas's simulated device width.
  mobile?: BreakpointOverride;
  tablet?: BreakpointOverride;
};

export type BreakpointOverride = {
  hidden?: boolean;
  align?: BlockAlign;
  width?: BlockWidth;
};

export const DEFAULT_BLOCK_LAYOUT: BlockLayout = { align: "center", width: "medium" };

// Scaled down from an earlier 400/576/768 pass (still ~1.5x/1.33x steps
// between each size, just smaller overall) per host feedback that even the
// smallest preset still read as too wide.
export const BLOCK_WIDTH_PX: Record<Exclude<BlockWidth, "full">, number> = {
  small: 300,
  medium: 450,
  large: 600,
};

// Matches Tailwind's own md/lg breakpoints (docs/05 "Breakpoints: Tailwind
// defaults") — mobile is anything narrower than md, tablet is [md, lg),
// desktop is lg and up. Shared by the live page's real `@media` rules and
// the builder's Tablet/Mobile device-simulation widths (768/390 — see
// page-builder.tsx's DEVICE_WIDTH_PX), so "what counts as mobile" agrees
// everywhere it matters.
export const MOBILE_MAX_PX = 767;
export const TABLET_MAX_PX = 1023;

export function resolveBlockLayout(layout: Partial<BlockLayout> | undefined): BlockLayout {
  return {
    align: layout?.align ?? DEFAULT_BLOCK_LAYOUT.align,
    width: layout?.width ?? DEFAULT_BLOCK_LAYOUT.width,
    minHeightPx: layout?.minHeightPx,
    textColorOverride: layout?.textColorOverride,
    customCss: layout?.customCss,
    flexGrow: layout?.flexGrow,
    gridSpan: layout?.gridSpan,
    hiddenOnDesktop: layout?.hiddenOnDesktop,
    mobile: layout?.mobile,
    tablet: layout?.tablet,
  };
}

export type HeroConfig = {
  showEventType?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showVenueLine?: boolean;
  showDescription?: boolean;
};

// "heading"/"title" switch to the site's own display serif (font-display) at
// a real, distinct size/weight — not just a bigger font-size — so a host
// gets an actual heading, not body text with a knob turned up. `color`, when
// set, is an inline style (always wins over the variant's own class,
// regardless of specificity) — unset falls back to the theme's foreground
// color, same as before this field existed.
export type TextVariant = "body" | "subheading" | "heading" | "title";

export type TextConfig = {
  body: string;
  variant?: TextVariant;
  color?: string;
};

// Width is controlled by the block's own Layout > Width preset (same
// mechanism every block uses) rather than a second, overlapping per-image
// max-width — one axis of control instead of two that could disagree.
// Height is a separate, independent axis, and a genuine *maximum* rather
// than a forced size: unset (or an image shorter than the cap) keeps the
// natural aspect ratio; a taller image is capped at maxHeightPx, either by
// cropping the overflow (`fit: "cover"`) or by scaling the whole image
// down to fit with nothing cropped (`fit: "contain"`).
export type ImageFit = "cover" | "contain";

export type ImageConfig = {
  url: string;
  alt?: string;
  maxHeightPx?: number;
  fit?: ImageFit;
};

export type SpacerConfig = {
  heightPx: number;
};

// Same per-image sizing controls as the Image block (ImageFit/maxHeightPx)
// — each slide keeps its own natural aspect ratio by default (no forced
// crop into a shared shape); a host can cap an individual slide's height
// if one photo is a very different shape from the rest, exactly like the
// single-image block's own "Max height" control.
export type CarouselImage = { url: string; alt?: string; maxHeightPx?: number; fit?: ImageFit };

export type CarouselConfig = {
  images: CarouselImage[];
  autoplay?: boolean;
  intervalMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
};

export type CountdownConfig = {
  label?: string;
};

export type RsvpFormBlockConfig = {
  heading?: string;
  helperText?: string;
  // Shown instead of the form when the visitor has no valid invite id —
  // previously hardcoded with no way for a host to change the wording.
  noInviteHeading?: string;
  noInviteMessage?: string;
  // Post-submit confirmation — also previously hardcoded.
  confirmedYesHeading?: string;
  confirmedNoHeading?: string;
  showVenueOnConfirmation?: boolean;
  // Full visual control over the post-submit screen: when set, this
  // replaces the built-in heading/field-list/venue-map layout with the
  // host's own markup, rendered in the same sandboxed iframe model as the
  // custom-html block (allow-scripts, no allow-same-origin). Supports the
  // same {{venue_map}} shortcode plus {{responses_summary}} (the guest's
  // own submitted answers, pre-formatted as an HTML list).
  confirmationHtml?: string;
  confirmationCss?: string;
  confirmationHeightPx?: number;
  // Shown instead of the form once the event's RSVP deadline (Settings)
  // has passed — same idea as noInviteHeading/Message, just gated on time
  // instead of on invite validity.
  deadlineClosedHeading?: string;
  deadlineClosedMessage?: string;
};

export type VenueMapBlockConfig = Record<string, never>;

export type CustomHtmlConfig = {
  html: string;
  css: string;
  js: string;
  heightPx: number;
  // Optional: naming this block saves its html/css/js to a host-level
  // library (see lib/data/custom-components.ts) whenever the page is saved
  // — referenceable from *any* block's HTML (any event) via
  // <custom-component name="..." attr="value" />, substituted at render
  // time (see lib/blocks/shortcodes.ts). Attributes on the tag become
  // {{attr}} tokens inside the saved snippet — no separate prop schema.
  reusableName?: string;
};

// Raw text like "border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.1);"
// — parsed into an inline style object (see layout-controls.tsx's
// parseInlineStyle), not injected as a <style> tag. That keeps it a plain
// visual affordance (no selectors, no way to affect anything outside this
// one container) rather than a second, unsandboxed code-injection surface
// alongside the custom-html block's sandboxed iframe.
export type ContainerLayoutMode = "column" | "row" | "grid";

// How nested elements are distributed along the row/grid's main axis and
// aligned on its cross axis — only meaningful (and only shown in the editor)
// for "row"/"grid" layout modes; a "column" stack's children are already
// each their own full-width, individually-aligned block (see BlockLayout.align).
export type ContainerJustify = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
export type ContainerAlignItems = "start" | "center" | "end" | "stretch";

export type ContainerConfig = {
  background?: string;
  paddingPx?: number;
  // How nested elements are arranged: stacked, side-by-side, or a grid —
  // exposed as explicit controls so arranging children in a flexbox row or
  // CSS grid doesn't require hand-typing customStyle.
  layoutMode?: ContainerLayoutMode;
  gapPx?: number;
  gridColumns?: number;
  justify?: ContainerJustify;
  alignItems?: ContainerAlignItems;
  customStyle?: string;
};

// `name` is a host-given label purely for identifying a block in the
// builder (canvas chips, the "Move to…" menu, the JSON editor) — it has no
// effect on the guest-facing render. Falls back to the block type's generic
// label everywhere it's displayed when unset, so it's optional and existing
// pages need no migration.
type BlockBase = { id: string; name?: string; layout?: BlockLayout };

export type BlockInstance =
  | (BlockBase & { type: "hero"; config: HeroConfig })
  | (BlockBase & { type: "text"; config: TextConfig })
  | (BlockBase & { type: "image"; config: ImageConfig })
  | (BlockBase & { type: "carousel"; config: CarouselConfig })
  | (BlockBase & { type: "spacer"; config: SpacerConfig })
  | (BlockBase & { type: "countdown"; config: CountdownConfig })
  | (BlockBase & { type: "rsvp-form"; config: RsvpFormBlockConfig })
  | (BlockBase & { type: "venue-map"; config: VenueMapBlockConfig })
  | (BlockBase & { type: "custom-html"; config: CustomHtmlConfig })
  | (BlockBase & { type: "container"; config: ContainerConfig; children: BlockInstance[] });

export type BlockType = BlockInstance["type"];

export type PageSchema = {
  version: 1;
  blocks: BlockInstance[];
  // Raw inline-style text (same safe parseInlineStyle mechanism as block
  // customCss) applied to the page's own root element — this is the "whole
  // body" styling surface a host can use for things no single block owns:
  // switching the root to `display: flex`/`grid` with its own direction/
  // gap, a page-wide background, max-width, etc.
  pageStyle?: string;
  // Per-page overrides of individual theme colors (background/foreground/
  // accent/accentDark/surface) — lets a host nudge their chosen theme's
  // palette without forking a whole new theme_id. See resolveThemeColors.
  themeOverrides?: ThemeColorOverrides;
  // A real `font-family` CSS value (e.g. "Georgia, serif") applied to the
  // page root — safe to inherit normally since no block hardcodes its own
  // font-family anywhere, unlike text color.
  fontFamily?: string;
  // The full escape hatch: when enabled, the guest page renders this single
  // sandboxed HTML/CSS/JS document instead of the block list — same
  // sandbox model as the custom-html block (allow-scripts, no
  // allow-same-origin), just sized to the whole page instead of one block.
  customPage?: {
    enabled: boolean;
    html: string;
    css: string;
    js: string;
  };
};

export function defaultPageSchema(): PageSchema {
  return {
    version: 1,
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "hero",
        config: {
          showEventType: true,
          showTitle: true,
          showSubtitle: true,
          showVenueLine: true,
          showDescription: true,
        },
      },
      { id: crypto.randomUUID(), type: "rsvp-form", config: {} },
      { id: crypto.randomUUID(), type: "venue-map", config: {} },
    ],
  };
}

// Real validation (structural + per-block filtering) lives in
// @/lib/schemas/page-schema's parsePageSchema — this module stays
// types-only so it can be imported from both the pure renderer and the
// zod schema without a circular dependency.
