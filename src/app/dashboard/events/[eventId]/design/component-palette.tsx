"use client";

import { useDraggable } from "@dnd-kit/core";
import type { BlockType } from "@/lib/blocks/types";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
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
const CATEGORIES: { label: string; types: BlockType[] }[] = [
  { label: "Layout", types: ["container"] },
  { label: "Content", types: ["hero", "text", "image", "carousel", "spacer", "countdown", "schedule"] },
  { label: "Guest interaction", types: ["rsvp-form", "venue-map"] },
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

export function ComponentPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Add a component</p>
        <p className="text-xs text-muted">Click to append, or drag onto the canvas to place it precisely.</p>
      </div>
      {CATEGORIES.map((category) => (
        <PaletteCategory key={category.label} label={category.label} types={category.types} onAdd={onAdd} />
      ))}
    </div>
  );
}
