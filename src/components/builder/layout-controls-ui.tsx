"use client";

import { useState } from "react";
import type { BlockAlign, BlockLayout, BlockWidth, ContainerLayoutMode } from "@/lib/blocks/types";
import { resolveBlockLayout } from "@/lib/blocks/types";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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

const BLOCK_CSS_GUIDE_EXAMPLES: { label: string; snippet: string }[] = [
  { label: "Background color", snippet: "background: #f4f4f5;" },
  { label: "Rounded corners", snippet: "border-radius: 12px;" },
  { label: "Border", snippet: "border: 1px solid #e4e4e7;" },
  { label: "Shadow", snippet: "box-shadow: 0 4px 12px rgba(0,0,0,.08);" },
  { label: "Padding", snippet: "padding: 24px;" },
  { label: "Extra spacing above", snippet: "margin-top: 32px;" },
  { label: "Text size", snippet: "font-size: 1.25rem;" },
];

export const PAGE_CSS_GUIDE_EXAMPLES: { label: string; snippet: string }[] = [
  { label: "Row layout", snippet: "display: flex; flex-direction: row; flex-wrap: wrap; gap: 24px;" },
  { label: "Column layout", snippet: "display: flex; flex-direction: column; gap: 24px;" },
  { label: "Grid, 2 columns", snippet: "display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" },
  { label: "Center everything", snippet: "align-items: center; justify-items: center;" },
  { label: "Page background", snippet: "background: #fafafa;" },
  { label: "Max page width", snippet: "max-width: 960px; margin-left: auto; margin-right: auto;" },
  { label: "Page padding", snippet: "padding: 48px 16px;" },
  { label: "Gap between blocks", snippet: "gap: 40px;" },
];

export function CustomCssField({
  value,
  onChange,
  label = "Custom CSS",
  helpText = "Any CSS property, one per line or separated by ;. Applies only to this block.",
  guideExamples = BLOCK_CSS_GUIDE_EXAMPLES,
  defaultOpen,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  label?: string;
  helpText?: string;
  guideExamples?: { label: string; snippet: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? Boolean(value));
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
      >
        <span>{label}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.08);"
            rows={3}
            spellCheck={false}
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{helpText}</p>
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className="shrink-0 text-xs font-medium text-accent hover:underline"
            >
              {showGuide ? "Hide examples" : "Show examples"}
            </button>
          </div>

          {showGuide && (
            <div className="grid grid-cols-1 gap-1 rounded-md border border-border bg-surface p-2 sm:grid-cols-2">
              {guideExamples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => onChange(value ? `${value.trim().replace(/;?$/, ";")} ${example.snippet}` : example.snippet)}
                  className="rounded px-2 py-1 text-left text-xs text-foreground hover:bg-surface-hover"
                  title={`Add "${example.snippet}"`}
                >
                  <span className="text-muted-foreground">{example.label}:</span>{" "}
                  <code className="font-mono">{example.snippet}</code>
                </button>
              ))}
            </div>
          )}
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted">Width</span>
          <ToggleGroup
            options={WIDTH_OPTIONS}
            value={resolved.width}
            onChange={(width) => onChange({ ...resolved, width: width as BlockWidth })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">Align</span>
          <ToggleGroup
            options={ALIGN_OPTIONS}
            value={resolved.align}
            onChange={(align) => onChange({ ...resolved, align: align as BlockAlign })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">Min height</span>
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
          <input
            type="color"
            value={resolved.textColorOverride ?? "#000000"}
            onChange={(e) => onChange({ ...resolved, textColorOverride: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
          />
          {resolved.textColorOverride && (
            <button
              type="button"
              onClick={() => onChange({ ...resolved, textColorOverride: undefined })}
              className="text-xs text-accent hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        {parentLayoutMode === "row" && (
          <div className="flex items-center gap-2">
            <span className="text-muted">Row share</span>
            <Input
              type="number"
              min={0}
              step={1}
              value={resolved.flexGrow ?? ""}
              onChange={(e) => onChange({ ...resolved, flexGrow: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="auto"
              className="h-7 w-16 px-2 text-xs"
            />
            <span className="text-muted" title="e.g. 2 here + 1 on two siblings = this one takes half the row">
              of siblings&rsquo; total
            </span>
          </div>
        )}
        {parentLayoutMode === "grid" && (
          <div className="flex items-center gap-2">
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
            <span className="text-muted">columns</span>
          </div>
        )}
      </div>
      <CustomCssField
        value={resolved.customCss}
        onChange={(customCss) => onChange({ ...resolved, customCss })}
        helpText="Any CSS property except text color — use the Text color control above for that (a plain color: here can't override each element's own color)."
      />
    </div>
  );
}
