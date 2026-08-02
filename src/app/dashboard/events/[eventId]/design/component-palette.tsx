"use client";

import { useDraggable } from "@dnd-kit/core";
import type { BlockType } from "@/lib/blocks/types";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { STARTER_LAYOUTS, type StarterLayoutId } from "@/lib/blocks/starter-layouts";
import { BlockCard } from "./block-card";

// Shared with page-builder.tsx's onDragEnd to distinguish "a new block being
// dragged in from the palette" from "an existing block being reordered" —
// existing block ids are plain UUIDs (crypto.randomUUID()) so this prefix
// can never collide with a real block id.
export const PALETTE_DRAG_PREFIX = "palette:";

// Categorized so the palette reads like a real page-builder component
// library (Formio/Webflow-style) instead of one flat grid of 9 buttons.
// Each card is both a click-to-append shortcut and a drag source (dropped
// onto the canvas at any position, or directly onto a container to nest
// inside it) — see page-builder.tsx's shared DndContext/onDragEnd. Always
// expanded, no nested boxes — a plain grouped list reads calmer than a
// stack of collapsible bordered panels.
//
// Ordered structural → generic content → event-specific info → guest-facing
// interaction → technical escape hatch, so scanning top to bottom roughly
// matches the order a host actually builds a page in. "Content" is plain
// building-block content usable on any page (a heading, an image, some
// space); "Event details" is content that's inherently about *this event*
// (when it starts, what happens when, where it is) rather than generic.
// "Layout" itself has no entry here — the starter-layout picker and the
// plain Container card both live under one "Layout" heading, rendered by
// LayoutCategory below, since they're both ways to get structure onto the
// page and having "Start with a layout" as its own separate section above
// duplicated that heading.
const CATEGORIES: { label: string; types: BlockType[] }[] = [
  { label: "Content", types: ["hero", "text", "image", "carousel", "spacer"] },
  { label: "Event details", types: ["countdown", "schedule", "venue-map"] },
  { label: "Guest interaction", types: ["rsvp-form"] },
  { label: "Advanced", types: ["custom-html"] },
];

function PaletteCard({ type, onAdd }: { type: BlockType; onAdd: (type: BlockType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${PALETTE_DRAG_PREFIX}${type}` });

  return (
    <BlockCard
      ref={setNodeRef}
      type={type}
      title={BLOCK_REGISTRY[type].label}
      variant="palette"
      dragging={isDragging}
      onClick={() => onAdd(type)}
      rootProps={{ ...attributes, ...listeners, title: `Add ${BLOCK_REGISTRY[type].label} — click to append, or drag onto the canvas` }}
    />
  );
}

function PaletteCategory({ label, types, onAdd }: { label: string; types: BlockType[]; onAdd: (type: BlockType) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <div className="space-y-1.5">
        {types.map((type) => (
          <PaletteCard key={type} type={type} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

// A few bars (not a real grid preview) — just enough to read as "1 wide
// section" vs "2/3 side-by-side sections" at a glance.
function StarterLayoutIcon({ columns }: { columns: number }) {
  return (
    <span className="flex h-6 w-10 gap-0.5">
      {Array.from({ length: columns }).map((_, i) => (
        <span key={i} className="flex-1 rounded-sm bg-current opacity-60" />
      ))}
    </span>
  );
}

// The "Layout" category: starter-layout shortcuts (click-only — each
// inserts a whole pre-built Container subtree, the grid wrapper plus its N
// empty nested Containers, see starter-layouts.ts, rather than a single
// block, so it doesn't fit the palette's usual "one BlockType, drag or
// click" contract) above the plain Container card (drag-or-click, one
// empty Container) — one heading, since both are "add structure," just at
// different starting points (pre-shaped vs. build-your-own).
function LayoutCategory({
  onAdd,
  onAddLayout,
}: {
  onAdd: (type: BlockType) => void;
  onAddLayout: (id: StarterLayoutId) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">Layout</p>
      <div className="space-y-1.5">
        {STARTER_LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onAddLayout(layout.id)}
            title={layout.description}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border p-2 text-left transition hover:border-border-strong hover:bg-surface"
          >
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
              <StarterLayoutIcon columns={layout.columns} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">{layout.label}</span>
              <span className="block truncate text-[11px] text-muted">{layout.description}</span>
            </span>
          </button>
        ))}
        <PaletteCard type="container" onAdd={onAdd} />
      </div>
    </div>
  );
}

export function ComponentPalette({
  onAdd,
  onAddLayout,
}: {
  onAdd: (type: BlockType) => void;
  onAddLayout: (id: StarterLayoutId) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Add a component</p>
        <p className="text-xs text-muted">Click to append, or drag onto the canvas to place it precisely.</p>
      </div>
      <LayoutCategory onAdd={onAdd} onAddLayout={onAddLayout} />
      {CATEGORIES.map((category) => (
        <PaletteCategory key={category.label} label={category.label} types={category.types} onAdd={onAdd} />
      ))}
    </div>
  );
}
