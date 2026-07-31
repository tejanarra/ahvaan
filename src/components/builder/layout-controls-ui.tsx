"use client";

import { useState } from "react";
import type { BlockAlign, BlockLayout, BlockWidth, BreakpointOverride, ContainerLayoutMode } from "@/lib/blocks/types";
import { resolveBlockLayout } from "@/lib/blocks/types";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";

const WIDTH_OPTIONS: { value: BlockWidth; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
  { value: "full", label: "Full" },
];

const ALIGN_OPTIONS: { value: BlockAlign; label: string }[] = [
  { value: "left", label: "⬅" },
  { value: "center", label: "◆" },
  { value: "right", label: "➡" },
];

// Every example bundles 2-4 properties together so clicking one always
// produces a *visible* change, regardless of which block it's applied to —
// a single "border-radius: 12px;" on its own is invisible on an element
// with no background, which was the #1 source of "I clicked it and
// nothing happened." Labels describe the visible result, not the raw CSS.
const BLOCK_CSS_PRESETS: { label: string; snippet: string }[] = [
  { label: "Card background", snippet: "background: #ffffff; padding: 20px; border-radius: 12px;" },
  { label: "Soft shadow", snippet: "box-shadow: 0 4px 16px rgba(0,0,0,.10); border-radius: 12px;" },
  { label: "Thin border", snippet: "border: 1px solid rgba(0,0,0,.12); border-radius: 8px; padding: 16px;" },
  { label: "Extra space above", snippet: "margin-top: 32px;" },
  { label: "Extra space below", snippet: "margin-bottom: 32px;" },
];

export const PAGE_CSS_GUIDE_EXAMPLES: { label: string; snippet: string }[] = [
  { label: "Side-by-side row", snippet: "display: flex; flex-direction: row; flex-wrap: wrap; gap: 24px; justify-content: center;" },
  { label: "Centered column, capped width", snippet: "max-width: 720px; margin-left: auto; margin-right: auto;" },
  { label: "Tinted page background", snippet: "background: #fafafa;" },
  { label: "More breathing room between blocks", snippet: "gap: 48px;" },
];

function CssPresetPicker({
  value,
  onChange,
  examples,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  examples: { label: string; snippet: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {examples.map((example) => (
        <button
          key={example.label}
          type="button"
          onClick={() => onChange(value ? `${value.trim().replace(/;?$/, ";")} ${example.snippet}` : example.snippet)}
          className="rounded-md border border-border px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:border-accent hover:bg-accent-soft"
        >
          + {example.label}
        </button>
      ))}
    </div>
  );
}

export function CustomCssField({
  value,
  onChange,
  label = "Custom CSS",
  helpText = "For hosts comfortable with CSS. Tap a button below to add a ready-made effect, or type your own.",
  guideExamples = BLOCK_CSS_PRESETS,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  label?: string;
  helpText?: string;
  guideExamples?: { label: string; snippet: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{helpText}</p>
      <CssPresetPicker value={value} onChange={onChange} examples={guideExamples} />
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. background: #ffffff; padding: 20px; border-radius: 12px;"
        rows={3}
        spellCheck={false}
        className="font-mono text-xs"
      />
    </div>
  );
}

const WIDTH_SELECT_LABEL: Record<BlockWidth, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  full: "Full",
};

// One device's override — leaving Width/Align at "Same as desktop" keeps
// that field unset (inheriting whatever the desktop control above is set
// to) rather than freezing in today's value, so changing the desktop
// setting later still flows through to a device that never explicitly
// overrode it.
function BreakpointOverrideFields({
  label,
  value,
  onChange,
  hideDisabled,
  fallbackLabel = "desktop",
}: {
  label: string;
  value: BreakpointOverride | undefined;
  onChange: (next: BreakpointOverride | undefined) => void;
  // True once the *other* two devices are already hidden — checking this
  // one too would leave the block invisible everywhere, which is never a
  // real intent (docs: "at least one screen size" must show it).
  hideDisabled: boolean;
  // What "unset" actually falls back to — "desktop" for mobile, but
  // "mobile" for tablet (see blockResponsiveCss's own fallback in
  // layout-controls.tsx: a tablet held portrait defaults to the mobile
  // override, not desktop, so a host doesn't have to duplicate one into
  // the other).
  fallbackLabel?: "desktop" | "mobile";
}) {
  const hidden = value?.hidden ?? false;

  const set = (patch: Partial<BreakpointOverride>) => {
    const next = { ...value, ...patch };
    // Drop the whole override object once every field is back to its
    // unset/default state, so a block nobody customized per-device stays
    // byte-for-byte the same as before this feature existed.
    const isEmpty = !next.hidden && !next.align && !next.width;
    onChange(isEmpty ? undefined : next);
  };

  return (
    <div className="space-y-2 rounded-md border border-border p-2.5">
      <label
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-foreground",
          hideDisabled && !hidden && "opacity-50"
        )}
        title={hideDisabled && !hidden ? "Already hidden on the other two — at least one screen size must show it." : undefined}
      >
        <Checkbox
          checked={hidden}
          disabled={hideDisabled && !hidden}
          onChange={(e) => set({ hidden: e.target.checked || undefined })}
        />
        Hide on {label}
      </label>
      {!hidden && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted">Width</span>
            <Select
              value={value?.width ?? ""}
              onChange={(e) => set({ width: e.target.value ? (e.target.value as BlockWidth) : undefined })}
            >
              <option value="">Same as {fallbackLabel}</option>
              {WIDTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {WIDTH_SELECT_LABEL[opt.value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted">Align</span>
            <Select
              value={value?.align ?? ""}
              onChange={(e) => set({ align: e.target.value ? (e.target.value as BlockAlign) : undefined })}
            >
              <option value="">Same as {fallbackLabel}</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function LayoutControls({
  layout,
  onChange,
  parentLayoutMode,
}: {
  layout: BlockLayout | undefined;
  onChange: (next: BlockLayout) => void;
  // Set when this block is a container's direct child — unlocks the
  // row/grid-specific "share of the row" / "grid span" ratio controls below,
  // which are meaningless (and hidden) for a top-level block or one nested
  // in a plain "column" stack.
  parentLayoutMode?: ContainerLayoutMode;
}) {
  const resolved = resolveBlockLayout(layout);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(resolved.minHeightPx || resolved.textColorOverride || resolved.customCss)
  );
  const [deviceOpen, setDeviceOpen] = useState(
    Boolean(resolved.mobile || resolved.tablet || resolved.hiddenOnDesktop)
  );

  // A block hidden on all three would be permanently invisible to every
  // guest — never a real intent, so the third "Hide on…" checkbox disables
  // itself once the other two are already checked.
  const desktopHidden = Boolean(resolved.hiddenOnDesktop);
  const mobileHidden = Boolean(resolved.mobile?.hidden);
  const tabletHidden = Boolean(resolved.tablet?.hidden);
  const hiddenCount = [desktopHidden, mobileHidden, tabletHidden].filter(Boolean).length;

  // The Width preset has no visible effect at all inside a grid container
  // (grid tracks size the block, not this preset) or inside a row — a row
  // child defaults to an equal share of the row (Row share unset behaves as
  // 1) rather than sizing to this preset, so Width only matters again once
  // Row share is explicitly set to 0 (opting back out to content-sized).
  // Showing an interactive-looking control that silently does nothing was
  // the exact "layout is finicky" complaint, so it's replaced with a
  // one-line explanation instead.
  const inGrid = parentLayoutMode === "grid";
  const rowShareActive = parentLayoutMode === "row" && resolved.flexGrow !== 0;
  const widthDisabled = inGrid || rowShareActive;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Width</span>
          {widthDisabled ? (
            <span className="text-xs italic text-muted-foreground">
              {inGrid ? "Set by this container's Grid columns" : "Set by Row share, below"}
            </span>
          ) : (
            <ToggleGroup
              options={WIDTH_OPTIONS}
              value={resolved.width}
              onChange={(width) => onChange({ ...resolved, width: width as BlockWidth })}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Align</span>
          <ToggleGroup
            options={ALIGN_OPTIONS}
            value={resolved.align}
            onChange={(align) => onChange({ ...resolved, align: align as BlockAlign })}
          />
        </div>
      </div>

      {parentLayoutMode === "row" && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Row share</span>
          <Input
            type="number"
            min={0}
            step={1}
            value={resolved.flexGrow ?? ""}
            onChange={(e) => onChange({ ...resolved, flexGrow: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="1"
            className="h-7 w-16 px-2 text-xs"
          />
          <span className="text-muted" title="e.g. 2 here + 1 on two siblings = this one takes half the row">
            Blank splits evenly (equal share of 1). Set a different number for a custom ratio, or 0 to size this one to its own content instead.
          </span>
        </div>
      )}
      {parentLayoutMode === "grid" && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Grid span</span>
          <Input
            type="number"
            min={1}
            max={12}
            step={1}
            value={resolved.gridSpan ?? 1}
            onChange={(e) => onChange({ ...resolved, gridSpan: e.target.value ? Number(e.target.value) : undefined })}
            className="h-7 w-16 px-2 text-xs"
          />
          <span className="text-muted">of this container&rsquo;s grid columns</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDeviceOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
      >
        {deviceOpen ? "Hide per-device options" : "Per-device options"}
        <span aria-hidden="true">{deviceOpen ? "▲" : "▼"}</span>
      </button>

      {deviceOpen && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Hide, resize, or realign this block on mobile/tablet without changing how it looks on desktop — or
            hide it on desktop only, for something you only want mobile/tablet visitors to see. Tablet fields left
            unset use your Mobile settings instead of Desktop's — a tablet held upright (portrait) is meant to look
            like mobile by default, the same way one held sideways (landscape) already looks like desktop with no
            setup. Use the Desktop/Tablet/Mobile toggle in the canvas toolbar to preview it.
          </p>
          <label
            className={cn(
              "flex items-center gap-2 rounded-md border border-border p-2.5 text-xs font-medium text-foreground",
              hiddenCount >= 2 && !desktopHidden && "opacity-50"
            )}
            title={
              hiddenCount >= 2 && !desktopHidden
                ? "Already hidden on the other two — at least one screen size must show it."
                : undefined
            }
          >
            <Checkbox
              checked={desktopHidden}
              disabled={hiddenCount >= 2 && !desktopHidden}
              onChange={(e) => onChange({ ...resolved, hiddenOnDesktop: e.target.checked || undefined })}
            />
            Hide on desktop
          </label>
          <BreakpointOverrideFields
            label="mobile"
            value={resolved.mobile}
            onChange={(mobile) => onChange({ ...resolved, mobile })}
            hideDisabled={hiddenCount >= 2 && !mobileHidden}
          />
          <BreakpointOverrideFields
            label="tablet"
            value={resolved.tablet}
            onChange={(tablet) => onChange({ ...resolved, tablet })}
            hideDisabled={hiddenCount >= 2 && !tabletHidden}
            fallbackLabel="mobile"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
      >
        {advancedOpen ? "Hide advanced options" : "Advanced options"}
        <span aria-hidden="true">{advancedOpen ? "▲" : "▼"}</span>
      </button>

      {advancedOpen && (
        <div className="space-y-4 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Minimum height</span>
              <Input
                type="number"
                min={0}
                step={10}
                value={resolved.minHeightPx ?? ""}
                onChange={(e) => onChange({ ...resolved, minHeightPx: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="auto"
                className="h-7 w-20 px-2 text-xs"
              />
              <span className="text-muted">px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Text color</span>
              {resolved.textColorOverride ? (
                <>
                  <input
                    type="color"
                    value={resolved.textColorOverride}
                    onChange={(e) => onChange({ ...resolved, textColorOverride: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...resolved, textColorOverride: undefined })}
                    className="text-xs text-accent hover:underline"
                  >
                    Use theme color instead
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange({ ...resolved, textColorOverride: "#000000" })}
                  className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent"
                >
                  Using theme color — override…
                </button>
              )}
            </div>
          </div>
          <CustomCssField
            value={resolved.customCss}
            onChange={(customCss) => onChange({ ...resolved, customCss })}
            label="Custom CSS (this block's own box)"
            helpText="Styles this block's position/spacing. Doesn't affect text color — use the control above for that."
          />
        </div>
      )}
    </div>
  );
}
