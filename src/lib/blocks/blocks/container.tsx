import type { ReactNode } from "react";
import type { ContainerAlignItems, ContainerConfig, ContainerJustify, ContainerLayoutMode } from "../types";
import { parseInlineStyle } from "../layout-controls";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";

export const containerDefaultConfig: ContainerConfig = { paddingPx: 24, layoutMode: "column", gapPx: 24 };

const LAYOUT_MODE_OPTIONS: { value: ContainerLayoutMode; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
  { value: "grid", label: "Grid" },
];

const JUSTIFY_OPTIONS: { value: ContainerJustify; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
  { value: "space-evenly", label: "Space evenly" },
];

const ALIGN_ITEMS_OPTIONS: { value: ContainerAlignItems; label: string }[] = [
  { value: "start", label: "Top" },
  { value: "center", label: "Center" },
  { value: "end", label: "Bottom" },
  { value: "stretch", label: "Stretch" },
];

const JUSTIFY_TO_CSS: Record<ContainerJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
};

const ALIGN_ITEMS_TO_CSS: Record<ContainerAlignItems, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

// Only meaningful (and only shown) for "row"/"grid" layout modes — a
// "column" stack's children are each already their own full-width block, so
// distributing/cross-aligning them at the container level has no visible
// effect (see layoutWrapperStyle's `inRow`/`inGrid` handling).
export function ContainerEdit({
  config,
  onChange,
  renderChildList,
}: {
  config: ContainerConfig;
  onChange: (next: ContainerConfig) => void;
  renderChildList?: () => ReactNode;
}) {
  const layoutMode = config.layoutMode ?? "column";
  const showDistribution = layoutMode !== "column";

  return (
    <div className="space-y-3">
      <Field label="Layout" hint="How nested elements are arranged: stacked, side-by-side, or a grid.">
        <ToggleGroup
          size="md"
          options={LAYOUT_MODE_OPTIONS}
          value={layoutMode}
          onChange={(mode) => onChange({ ...config, layoutMode: mode as ContainerLayoutMode })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Background">
          <Input
            type="text"
            value={config.background ?? ""}
            onChange={(e) => onChange({ ...config, background: e.target.value })}
            placeholder="e.g. #f4f4f5 or transparent"
          />
        </Field>
        <Field label="Padding">
          <Input
            type="number"
            min={0}
            max={200}
            value={config.paddingPx ?? 0}
            onChange={(e) => onChange({ ...config, paddingPx: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Gap between elements">
          <Input
            type="number"
            min={0}
            max={200}
            value={config.gapPx ?? 24}
            onChange={(e) => onChange({ ...config, gapPx: Number(e.target.value) || 0 })}
          />
        </Field>
        {layoutMode === "grid" && (
          <Field label="Grid columns">
            <Input
              type="number"
              min={1}
              max={6}
              value={config.gridColumns ?? 2}
              onChange={(e) => onChange({ ...config, gridColumns: Number(e.target.value) || 1 })}
            />
          </Field>
        )}
      </div>

      {showDistribution && (
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Distribute"
            hint={
              layoutMode === "row"
                ? "How elements spread out if they don't fill the whole row — e.g. 3 elements: \"Space between\" pins the first/last to the edges, \"Center\" groups all 3 in the middle."
                : "How grid tracks spread out if they don't fill the container's full width."
            }
          >
            <Select
              value={config.justify ?? "start"}
              onChange={(e) => onChange({ ...config, justify: e.target.value as ContainerJustify })}
            >
              {JUSTIFY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vertical align" hint="How elements line up if one is taller than the others.">
            <ToggleGroup
              size="sm"
              options={ALIGN_ITEMS_OPTIONS}
              value={config.alignItems ?? "stretch"}
              onChange={(v) => onChange({ ...config, alignItems: v as ContainerAlignItems })}
            />
          </Field>
        </div>
      )}

      {layoutMode !== "column" && (
        <p className="text-xs text-muted">
          Each nested element also has its own &ldquo;Row share&rdquo;/&ldquo;Grid span&rdquo; control (in that
          element&rsquo;s own Layout section) for setting how much space it takes relative to its siblings — e.g. a
          2:1:1 ratio across 3 elements.
        </p>
      )}

      <Field
        label="Custom CSS (inside this container)"
        hint="Styles this box itself — background, corners, shadow. Different from the 'Custom CSS' under this block's Layout section, which positions the box on the page."
      >
        <Textarea
          value={config.customStyle ?? ""}
          onChange={(e) => onChange({ ...config, customStyle: e.target.value })}
          placeholder="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.08);"
          rows={3}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </Field>

      {renderChildList ? (
        <div className="rounded-md border border-dashed border-border bg-surface p-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Nested elements</p>
          {renderChildList()}
        </div>
      ) : (
        <p className="text-xs text-muted">Nested elements are edited directly in the live canvas — click into one to select it.</p>
      )}
    </div>
  );
}

export function ContainerRender({
  config,
  renderedChildren,
}: {
  config: ContainerConfig;
  renderedChildren?: ReactNode[];
}) {
  const layoutMode = config.layoutMode ?? "column";
  // The Edit control clamps gap/padding/columns to sane ranges, but a
  // hand-edited JSON schema can set anything (negative, NaN, absurdly
  // large) — negative gap/padding is invalid CSS (silently ignored, but
  // inconsistently across browsers) and `repeat(0, 1fr)`/negative column
  // counts break the grid entirely, so clamp all three here too.
  const clampedGap = Number.isFinite(config.gapPx) ? Math.max(0, Math.min(400, config.gapPx as number)) : 24;
  const clampedPadding = Number.isFinite(config.paddingPx) ? Math.max(0, Math.min(400, config.paddingPx as number)) : 0;
  const clampedColumns = Number.isFinite(config.gridColumns) ? Math.max(1, Math.min(12, config.gridColumns as number)) : 2;
  const gap = `${clampedGap}px`;
  const justify = JUSTIFY_TO_CSS[config.justify ?? "start"];
  const alignItems = ALIGN_ITEMS_TO_CSS[config.alignItems ?? "stretch"];

  const layoutStyle =
    layoutMode === "grid"
      ? // minmax(0, 1fr), not bare 1fr — bare 1fr resolves to minmax(auto, 1fr),
        // so a track holding an unbreakable long word (or any content whose
        // min-content width exceeds its equal share) grows past its share and
        // pushes into the next column instead of wrapping/clipping in place.
        { display: "grid", gridTemplateColumns: `repeat(${clampedColumns}, minmax(0, 1fr))`, gap, justifyContent: justify, alignItems }
      : {
          display: "flex",
          flexDirection: layoutMode === "row" ? ("row" as const) : ("column" as const),
          flexWrap: "wrap" as const,
          gap,
          ...(layoutMode === "row" ? { justifyContent: justify, alignItems } : {}),
        };

  const style = {
    background: config.background || undefined,
    padding: `${clampedPadding}px`,
    ...layoutStyle,
    ...parseInlineStyle(config.customStyle),
  };

  return (
    <div className="w-full" style={style}>
      {renderedChildren}
      {(!renderedChildren || renderedChildren.length === 0) && (
        <p className="text-sm italic text-[var(--t-fg)]/40">Empty container — add elements to it in the builder.</p>
      )}
    </div>
  );
}
