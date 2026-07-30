"use client";

import { type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockInstance, ContainerLayoutMode } from "@/lib/page-blocks/types";
import type { PageRenderContext } from "@/lib/page-blocks/context";
import { BLOCK_REGISTRY } from "@/lib/page-blocks/registry";
import { layoutWrapperStyle } from "@/lib/page-blocks/layout-controls";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { DragHandleIcon, EditIcon } from "@/components/icons";
import { emptyListId } from "./dnd-ids";
import { cn } from "@/lib/cn";

export type BlockPath = { containerId: string | null; blockId: string };

// The canvas *is* the real guest-facing render (same BLOCK_REGISTRY.Render
// output, same theme CSS vars) — Formio-style "edit what you see" instead of
// a separate abstract block list. Each block gets a thin interactive shell
// (hover outline, floating drag/edit/delete toolbar, click-to-open) wrapped
// around its real rendered content; clicking anywhere on a block opens its
// settings in a modal (see page-builder.tsx) instead of a persistent side
// panel, which is what was causing the "scroll down to select, can't see
// preview or settings" problem with the old three-pane layout.
function EditableBlock({
  block,
  containerId,
  parentLayoutMode,
  ctx,
  selectedPath,
  onSelect,
  onRemove,
}: {
  block: BlockInstance;
  containerId: string | null;
  parentLayoutMode?: ContainerLayoutMode;
  ctx: PageRenderContext;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: block.id });
  const def = BLOCK_REGISTRY[block.type];
  const path: BlockPath = { containerId, blockId: block.id };
  const isSelected = selectedPath?.containerId === containerId && selectedPath?.blockId === block.id;
  const isContainer = "children" in block;

  const wrapperStyle = {
    ...layoutWrapperStyle(block.layout, parentLayoutMode),
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!def) {
    return (
      <div ref={setNodeRef} style={wrapperStyle} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-center gap-2">
          <span {...attributes} {...listeners} className="cursor-grab text-muted">
            <DragHandleIcon className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm text-destructive">
            Unknown block type &ldquo;{block.type}&rdquo; — remove it to continue editing.
          </p>
          <ConfirmIconButton label="Remove block" confirmText="Remove this unrecognized block?" onConfirm={async () => onRemove(path)} />
        </div>
      </div>
    );
  }

  const Render = def.Render;
  const isEmptyContainer = isContainer && block.children.length === 0;

  const renderedChildren: ReactNode[] | undefined =
    isContainer && !isEmptyContainer
      ? [
          <SortableContext key="children" items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {block.children.map((child) => (
              <EditableBlock
                key={child.id}
                block={child}
                containerId={block.id}
                parentLayoutMode={block.config.layoutMode ?? "column"}
                ctx={ctx}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>,
        ]
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      className={cn(
        // A block can render nothing yet (e.g. a freshly-added Image block
        // with no URL set — its Render returns null until configured) — a
        // guaranteed minimum height keeps it visible and clickable in the
        // canvas instead of collapsing to zero-height and looking like it
        // was never added at all. `layoutWrapperStyle`'s own minHeightPx,
        // when set, overrides this via the inline style above (more specific).
        "group relative min-h-14 rounded-lg",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-1.5 rounded-xl ring-2 transition-all",
          isSelected ? "ring-accent" : isContainer && isOver ? "ring-2 ring-dashed ring-accent/60" : "ring-transparent group-hover:ring-accent/30"
        )}
      />
      <div
        className={cn(
          "absolute -top-3.5 right-1 z-20 flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 shadow-sm transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <span
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={0}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded p-1 text-muted hover:bg-surface hover:text-foreground active:cursor-grabbing"
        >
          <DragHandleIcon className="h-3.5 w-3.5" />
        </span>
        <button
          type="button"
          onClick={() => onSelect(path)}
          aria-label={`Edit ${def.label}`}
          className="rounded p-1 text-muted hover:bg-surface hover:text-foreground"
        >
          <EditIcon className="h-3.5 w-3.5" />
        </button>
        <ConfirmIconButton label="Remove block" confirmText={`Remove "${def.label}" from the page?`} onConfirm={async () => onRemove(path)} />
      </div>

      {isEmptyContainer ? (
        <EmptyDropZone containerId={block.id} onClick={() => onSelect(path)} />
      ) : (
        <>
          <Render config={block.config} ctx={ctx} renderedChildren={renderedChildren} />
          <button
            type="button"
            onClick={() => onSelect(path)}
            aria-label={`Edit ${def.label}`}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        </>
      )}
    </div>
  );
}

// A droppable placeholder for a list with no blocks yet (top-level page, or
// an empty container) — an empty `SortableContext` has nothing to hover, so
// without this a palette drag has nowhere to land until at least one block
// exists here.
export function EmptyDropZone({ containerId, onClick }: { containerId: string | null; onClick?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "rounded-xl border border-dashed p-6 text-center text-sm transition-colors",
        onClick && "cursor-pointer",
        isOver ? "border-accent bg-accent/5 text-foreground" : "border-border text-muted"
      )}
    >
      Drag a component here from the left
    </div>
  );
}

export function EditableCanvas({
  blocks,
  ctx,
  selectedPath,
  onSelect,
  onRemove,
}: {
  blocks: BlockInstance[];
  ctx: PageRenderContext;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
}) {
  if (blocks.length === 0) {
    return <EmptyDropZone containerId={null} />;
  }

  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-10 py-4">
        {blocks.map((block) => (
          <EditableBlock key={block.id} block={block} containerId={null} ctx={ctx} selectedPath={selectedPath} onSelect={onSelect} onRemove={onRemove} />
        ))}
      </div>
    </SortableContext>
  );
}
