"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { EventRecord } from "@/lib/data/events";
import type { BlockInstance, ContainerLayoutMode, PageSchema } from "@/lib/blocks/types";
import type { PageRenderContext } from "@/lib/blocks/context";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { layoutWrapperStyle } from "@/lib/blocks/layout-controls";
import { LayoutControls, CustomCssField, PAGE_CSS_GUIDE_EXAMPLES } from "@/components/builder/layout-controls-ui";
import { resolveThemeColors, type Theme, type ThemeId, type ThemeColorOverrides } from "@/lib/themes";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { BlockTypeBadge } from "./block-card";
import { PanelSection } from "./panel-section";

export type CustomPageConfig = NonNullable<PageSchema["customPage"]>;

const TOP_LEVEL_DESTINATION = "__top_level__";

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "Georgia, 'Times New Roman', serif", label: "Serif" },
  { value: "'Courier New', monospace", label: "Mono" },
  { value: "Verdana, Geneva, sans-serif", label: "Rounded" },
];

const COLOR_FIELDS: { key: keyof ThemeColorOverrides; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "accent", label: "Accent" },
  { key: "accentDark", label: "Accent (dark)" },
  { key: "surface", label: "Surface" },
];

// True cross-container drag (moving an *existing* block from one list into
// a different one) is out of scope for the drag-and-drop rework — this
// dropdown is the deliberate substitute. Only offered for non-container
// blocks, since containers can't be nested inside another container.
function MoveToControl({
  currentContainerId,
  containerOptions,
  onMoveTo,
}: {
  currentContainerId: string | null;
  containerOptions: { id: string; label: string }[];
  onMoveTo: (containerId: string | null) => void;
}) {
  if (containerOptions.length === 0 && currentContainerId === null) return null;

  return (
    <PanelSection title="Position" hint="Relocate this block to the top level or into a different container.">
      <Select
        value={currentContainerId ?? TOP_LEVEL_DESTINATION}
        onChange={(e) => onMoveTo(e.target.value === TOP_LEVEL_DESTINATION ? null : e.target.value)}
      >
        <option value={TOP_LEVEL_DESTINATION}>Top level (page)</option>
        {containerOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
    </PanelSection>
  );
}

function ThemeColorEditor({
  themeId,
  overrides,
  onChange,
}: {
  themeId: ThemeId;
  overrides: ThemeColorOverrides | undefined;
  onChange: (next: ThemeColorOverrides) => void;
}) {
  const resolved = resolveThemeColors(themeId, overrides);
  const [open, setOpen] = useState(false);
  const hasOverrides = Boolean(overrides && Object.keys(overrides).length > 0);

  return (
    <PanelSection
      title="Theme colors"
      actions={
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-accent hover:underline">
          {open ? "Hide" : hasOverrides ? "Edit" : "Customize"}
        </button>
      }
    >
      {open && (
        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="color"
                value={resolved[key]}
                onChange={(e) => onChange({ ...overrides, [key]: e.target.value })}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
              />
              {label}
            </label>
          ))}
          {hasOverrides && (
            <button type="button" onClick={() => onChange({})} className="col-span-2 text-left text-xs text-accent hover:underline">
              Reset to theme defaults
            </button>
          )}
        </div>
      )}
    </PanelSection>
  );
}

export function PageSettings({
  themeId,
  themeOverrides,
  onThemeOverridesChange,
  fontFamily,
  onFontFamilyChange,
  pageStyle,
  onPageStyleChange,
  customPage,
  onCustomPageChange,
}: {
  themeId: ThemeId;
  themeOverrides: ThemeColorOverrides;
  onThemeOverridesChange: (next: ThemeColorOverrides) => void;
  fontFamily: string;
  onFontFamilyChange: (next: string) => void;
  pageStyle: string;
  onPageStyleChange: (next: string) => void;
  customPage: CustomPageConfig;
  onCustomPageChange: (next: CustomPageConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Page settings</p>
        <p className="text-xs text-muted">No block selected — these apply to the whole invite page.</p>
      </div>

      <ThemeColorEditor themeId={themeId} overrides={themeOverrides} onChange={onThemeOverridesChange} />

      <PanelSection title="Font">
        <ToggleGroup options={FONT_OPTIONS} value={fontFamily} onChange={onFontFamilyChange} />
      </PanelSection>

      <PanelSection title="Page CSS" hint="For hosts comfortable with CSS — arranges or styles the whole page, not one block.">
        <CustomCssField
          label="Custom CSS (whole page)"
          helpText="Tap a button below to add a ready-made layout, or type your own."
          guideExamples={PAGE_CSS_GUIDE_EXAMPLES}
          value={pageStyle}
          onChange={onPageStyleChange}
        />
      </PanelSection>

      <PanelSection
        title="Complete custom page"
        hint={'Replaces the whole page below with your own HTML/CSS/JS in a sandboxed frame — the blocks list is ignored while this is on, but not deleted. Write "{{rsvp_form}}" or "{{venue_map}}" anywhere in the HTML to embed the real, working RSVP form or venue map.'}
      >
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Checkbox checked={customPage.enabled} onChange={(e) => onCustomPageChange({ ...customPage, enabled: e.target.checked })} />
          Enable
        </label>
        {customPage.enabled && (
          <div className="space-y-2 pt-1">
            <Field label="HTML">
              <Textarea
                value={customPage.html}
                onChange={(e) => onCustomPageChange({ ...customPage, html: e.target.value })}
                rows={5}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="CSS">
              <Textarea
                value={customPage.css}
                onChange={(e) => onCustomPageChange({ ...customPage, css: e.target.value })}
                rows={5}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="JavaScript" hint="Optional">
              <Textarea
                value={customPage.js}
                onChange={(e) => onCustomPageChange({ ...customPage, js: e.target.value })}
                rows={4}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        )}
      </PanelSection>
    </div>
  );
}

// Non-interactive recursive render, purely for the modal's preview strip —
// reuses the exact same BLOCK_REGISTRY.Render every guest sees, just without
// the canvas's hover/select/drag chrome. Each level is wrapped in the same
// `layoutWrapperStyle` the real page-renderer/canvas apply — width, align,
// min-height, text-color override, and custom CSS all live on `block.layout`,
// not inside `Render` itself, so skipping this wrapper (the original bug
// here) meant changing Width/Align/etc. had no visible effect in the preview.
function renderBlockPreview(block: BlockInstance, ctx: PageRenderContext, parentLayoutMode?: ContainerLayoutMode): ReactNode {
  const def = BLOCK_REGISTRY[block.type];
  if (!def) return null;
  const Render = def.Render;
  const childLayoutMode = "children" in block ? (block.config.layoutMode ?? "column") : undefined;
  const renderedChildren = "children" in block ? block.children.map((child) => renderBlockPreview(child, ctx, childLayoutMode)) : undefined;
  return (
    <div key={block.id} style={layoutWrapperStyle(block.layout, parentLayoutMode)}>
      <Render config={block.config} ctx={ctx} renderedChildren={renderedChildren} />
    </div>
  );
}

export function PropertiesPanel({
  selectedBlock,
  onChangeSelected,
  onRemoveSelected,
  event,
  onEventFieldsChange,
  ctx,
  themeColors,
  fontFamily,
  currentContainerId,
  parentLayoutMode,
  containerOptions,
  onMoveTo,
}: {
  selectedBlock: BlockInstance;
  onChangeSelected: (next: BlockInstance) => void;
  onRemoveSelected: () => void;
  event: EventRecord;
  onEventFieldsChange: (patch: Partial<EventRecord>) => void;
  ctx: PageRenderContext;
  themeColors: Theme["colors"];
  fontFamily: string;
  currentContainerId: string | null;
  parentLayoutMode?: ContainerLayoutMode;
  containerOptions: { id: string; label: string }[];
  onMoveTo: (containerId: string | null) => void;
}) {
  const def = BLOCK_REGISTRY[selectedBlock.type];
  if (!def) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          Unknown block type &ldquo;{selectedBlock.type}&rdquo; — remove it to continue editing.
        </p>
        <ConfirmIconButton label="Remove block" confirmText="Remove this unrecognized block?" onConfirm={async () => onRemoveSelected()} />
      </div>
    );
  }

  const Edit = def.Edit;
  const childBlocks = "children" in selectedBlock ? selectedBlock.children : undefined;

  // Fixed two-column layout for every block type — settings on the left
  // (scrolls independently), live preview on the right (always visible
  // while adjusting settings) — same shape regardless of how many fields a
  // given block type has, so every block's modal feels consistent.
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-6 md:grid-cols-[2fr_3fr]">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex items-center gap-2.5">
          <BlockTypeBadge type={selectedBlock.type} />
          <input
            type="text"
            value={selectedBlock.name ?? ""}
            onChange={(e) => onChangeSelected({ ...selectedBlock, name: e.target.value || undefined } as BlockInstance)}
            placeholder={def.label}
            aria-label="Block name"
            className="min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-foreground hover:border-border focus:border-accent focus:bg-surface focus:outline-none"
          />
          <ConfirmIconButton label="Remove block" confirmText={`Remove "${selectedBlock.name || def.label}" from the page?`} onConfirm={async () => onRemoveSelected()} />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          {selectedBlock.name ? `${def.label} block` : "Give this block a name to find it easily, especially inside containers."}
        </p>

        <PanelSection title="Layout">
          <LayoutControls
            layout={selectedBlock.layout}
            onChange={(layout) => onChangeSelected({ ...selectedBlock, layout } as BlockInstance)}
            parentLayoutMode={parentLayoutMode}
          />
        </PanelSection>

        {!("children" in selectedBlock) && (
          <MoveToControl currentContainerId={currentContainerId} containerOptions={containerOptions} onMoveTo={onMoveTo} />
        )}

        <PanelSection title={`${def.label} settings`}>
          <Edit
            config={selectedBlock.config}
            onChange={(next) => onChangeSelected({ ...selectedBlock, config: next } as BlockInstance)}
            childBlocks={childBlocks}
            event={event}
            onEventFieldsChange={onEventFieldsChange}
          />
        </PanelSection>
      </div>

      <div className="flex min-h-0 flex-col gap-2">
        <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted">Preview</p>
        <div
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-[var(--t-bg)] p-4"
          style={
            {
              "--t-bg": themeColors.background,
              "--t-fg": themeColors.foreground,
              "--t-accent": themeColors.accent,
              "--t-accent-dark": themeColors.accentDark,
              "--t-surface": themeColors.surface,
              fontFamily: fontFamily || undefined,
            } as CSSProperties
          }
        >
          {renderBlockPreview(selectedBlock, ctx)}
        </div>
      </div>
    </div>
  );
}
