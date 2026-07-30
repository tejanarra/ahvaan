"use client";

import { forwardRef, type CSSProperties, type ComponentType, type HTMLAttributes, type ReactNode } from "react";
import type { BlockType } from "@/lib/blocks/types";
import {
  SparkleIcon,
  TextLinesIcon,
  ImageIcon,
  ImagesIcon,
  MinusLineIcon,
  ClockIcon,
  ClipboardListIcon,
  MapPinIcon,
  CodeBracketsIcon,
  BoxIcon,
} from "@/components/icons";
import { cn } from "@/lib/cn";

// One consistent icon family (all accent-tinted, not a different color per
// type) so the canvas reads calmly at a glance — the icon shape carries the
// "what is this" signal, not a rainbow of colors.
const BLOCK_TYPE_ICON: Record<BlockType, ComponentType<{ className?: string }>> = {
  hero: SparkleIcon,
  text: TextLinesIcon,
  image: ImageIcon,
  carousel: ImagesIcon,
  spacer: MinusLineIcon,
  countdown: ClockIcon,
  "rsvp-form": ClipboardListIcon,
  "venue-map": MapPinIcon,
  "custom-html": CodeBracketsIcon,
  container: BoxIcon,
};

export type BlockCardVisualState = "default" | "selected" | "dropTarget";

// The single reusable primitive every visual surface in the builder is
// built from: the canvas row, the palette source card, and (later) the
// drag preview all render the same icon-badge + title/meta shape, just
// with different chrome around it (drag handle, actions, draggable).
export const BlockCard = forwardRef<
  HTMLDivElement,
  {
    type: BlockType;
    title: string;
    meta?: string;
    state?: BlockCardVisualState;
    dragging?: boolean;
    style?: CSSProperties;
    className?: string;
    onClick?: () => void;
    dragHandle?: ReactNode;
    actions?: ReactNode;
    variant?: "canvas" | "palette";
    // Spread directly onto the root element — used by the palette variant
    // to attach dnd-kit's `useDraggable` attributes/listeners to the whole
    // card (it has no separate drag handle the way canvas rows do).
    rootProps?: HTMLAttributes<HTMLDivElement>;
  }
>(function BlockCard(
  { type, title, meta, state = "default", dragging, style, className, onClick, dragHandle, actions, variant = "canvas", rootProps },
  ref
) {
  const Icon = BLOCK_TYPE_ICON[type];

  return (
    <div
      ref={ref}
      style={style}
      {...rootProps}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border bg-background px-2.5 py-2.5 transition-all",
        state === "selected"
          ? "border-accent bg-accent/[0.06] shadow-sm shadow-accent/10"
          : "border-border hover:border-border-strong hover:bg-surface",
        state === "dropTarget" && "border-dashed border-accent bg-accent/5",
        dragging && "scale-[0.98] opacity-50",
        variant === "palette" && "cursor-grab touch-none select-none active:cursor-grabbing",
        className
      )}
    >
      {dragHandle}
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          state === "selected" ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
      </span>
      {onClick ? (
        <button type="button" onClick={onClick} className="flex min-w-0 flex-1 flex-col items-start text-left">
          <BlockCardLabel title={title} meta={meta} />
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-start text-left">
          <BlockCardLabel title={title} meta={meta} />
        </div>
      )}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
});

// A standalone icon badge (no card chrome) for reuse anywhere that needs to
// show "what type of block is this" outside the canvas/palette rows — e.g.
// the Properties Panel's header for the currently-selected block.
export function BlockTypeBadge({ type, className }: { type: BlockType; className?: string }) {
  const Icon = BLOCK_TYPE_ICON[type];
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent", className)}>
      {Icon && <Icon className="h-4 w-4" />}
    </span>
  );
}

function BlockCardLabel({ title, meta }: { title: string; meta?: string }) {
  return (
    <>
      <span className="truncate text-sm font-medium leading-tight text-foreground">{title}</span>
      {meta && <span className="truncate text-xs leading-tight text-muted">{meta}</span>}
    </>
  );
}
