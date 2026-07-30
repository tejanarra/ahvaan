"use client";

import { useState, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockInstance, ContainerLayoutMode } from "@/lib/blocks/types";
import type { PageRenderContext } from "@/lib/blocks/context";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { layoutWrapperStyle } from "@/lib/blocks/layout-controls";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { DragHandleIcon, EditIcon, MoveOutIcon, ChevronDownIcon } from "@/components/icons";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { emptyListId } from "./dnd-ids";
import { cn } from "@/lib/cn";

export type BlockPath = { containerId: string | null; blockId: string };
export type ContainerOption = { id: string; label: string };

// Every container id nested inside this block (not including the block's
// own id) — used to keep a container from being offered as a "Move to…"
// destination for itself.
function descendantContainerIds(block: BlockInstance): string[] {
  if (!("children" in block)) return [];
  return block.children.flatMap((c) => ("children" in c ? [c.id, ...descendantContainerIds(c)] : []));
}

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
  onMoveOut,
  onMoveTo,
  containerOptions,
  depth = 0,
  hoveredPath,
  onHover,
  onHoverEnd,
}: {
  block: BlockInstance;
  containerId: string | null;
  parentLayoutMode?: ContainerLayoutMode;
  ctx: PageRenderContext;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  // A guaranteed, drag-free way to pull a block back out to the page's top
  // level — only rendered (in the toolbar below) when this block is
  // actually nested (containerId !== null). Dragging works too (see the
  // always-present end-of-list drop zone), but drag targets can be fiddly
  // to hit precisely; this button is the reliable fallback (host feedback:
  // "unable to move to outer").
  onMoveOut: (path: BlockPath) => void;
  // The general case: move this block into a specific container (or the
  // top level) regardless of where it currently lives — a one-click,
  // drag-free way to relocate between two different containers, which drag
  // alone struggled with (host feedback: "unable to move components into a
  // nested -> nested component", "unable to stack two ... into one").
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  containerOptions: ContainerOption[];
  // How many containers deep this block sits (0 = top level). Controls in
  // deeper blocks get a higher z-index than their ancestors' own chrome
  // (name chips, hover rings) — without this, every block's toolbar used
  // the same fixed z-index, so DOM paint order (not nesting depth) decided
  // what ended up on top, and a nested block's edit/drag controls could
  // render underneath an ancestor container's own UI (host feedback: "the
  // edit or drag menu for a component is getting buried").
  depth?: number;
  // Which block's toolbar should be showing — tracked as JS state (see
  // EditableCanvas) instead of CSS `:hover`, because `:hover` bubbles to
  // every DOM ancestor: hovering a nested block also counts as hovering
  // every container wrapping it, so a plain `group-hover` trigger made a
  // child's toolbar AND every ancestor's toolbar appear at once,
  // overlapping each other (host-reported, confirmed via screenshot).
  // `onHover` is called with `stopPropagation()` so only the deepest
  // element actually under the pointer claims it.
  hoveredPath: BlockPath | null;
  onHover: (path: BlockPath) => void;
  onHoverEnd: (path: BlockPath) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: block.id });
  const def = BLOCK_REGISTRY[block.type];
  const path: BlockPath = { containerId, blockId: block.id };
  const isSelected = selectedPath?.containerId === containerId && selectedPath?.blockId === block.id;
  const isHovered = hoveredPath?.containerId === containerId && hoveredPath?.blockId === block.id;
  const isContainer = "children" in block;
  // Base 20 keeps this above ordinary page content; +10 per nesting level
  // keeps every deeper block's own controls above every shallower block's.
  const controlsZIndex = 20 + depth * 10;
  // Purely a canvas-navigation aid (never saved to the schema) — folding a
  // container's contents away makes a deeply-nested layout scannable
  // instead of one long scroll of every nested block's full render.
  const [collapsed, setCollapsed] = useState(false);

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

  // Built entirely by the editor (never by the real guest page-renderer,
  // which constructs its own renderedChildren with no drop zones) — safe to
  // include an extra drop-target element alongside the actual child blocks.
  const renderedChildren: ReactNode[] | undefined =
    isContainer && !isEmptyContainer
      ? [
          <SortableContext key="children" items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {block.children.map((child) => (
              // Editor-only minimum spacing around every nested child,
              // independent of this container's own configured gap/padding
              // (which still applies exactly as set on the real guest
              // page) — with those set to 0, children rendered flush
              // against the container's edges and each other, leaving no
              // physical room to hover/click one specifically without
              // grabbing its neighbor (host feedback: "always show some
              // gap between nested components for easier access").
              <div key={child.id} className="p-1">
                <EditableBlock
                  block={child}
                  containerId={block.id}
                  parentLayoutMode={block.config.layoutMode ?? "column"}
                  ctx={ctx}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onMoveOut={onMoveOut}
                  onMoveTo={onMoveTo}
                  containerOptions={containerOptions}
                  depth={depth + 1}
                  hoveredPath={hoveredPath}
                  onHover={onHover}
                  onHoverEnd={onHoverEnd}
                />
              </div>
            ))}
          </SortableContext>,
          <EndOfListDropZone key="end" containerId={block.id} />,
        ]
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      onMouseOver={(e) => {
        e.stopPropagation();
        onHover(path);
      }}
      onMouseLeave={() => onHoverEnd(path)}
      className={cn(
        // A block can render nothing yet (e.g. a freshly-added Image block
        // with no URL set — its Render returns null until configured) — a
        // guaranteed minimum height keeps it visible and clickable in the
        // canvas instead of collapsing to zero-height and looking like it
        // was never added at all. `layoutWrapperStyle`'s own minHeightPx,
        // when set, overrides this via the inline style above (more specific).
        "relative min-h-14 rounded-lg",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-1.5 rounded-xl ring-2 transition-all",
          isSelected
            ? "ring-accent"
            : isContainer && isOver
              ? "ring-2 ring-dashed ring-accent/60"
              : isHovered
                ? "ring-accent/30"
                : "ring-transparent"
        )}
      />
      <div
        style={{ zIndex: controlsZIndex }}
        className={cn(
          "absolute -top-3.5 right-1 flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 shadow-sm transition-opacity",
          // Containers stay permanently visible rather than hover-gated: a
          // container padded/gapped down to 0px has no exposed background
          // left to hover at all once it holds children, which made its own
          // toolbar (and therefore its Edit/Move/Delete actions) completely
          // unreachable (host feedback: "if I put 0 padding in outer nested
          // component it is becoming very difficult to access it").
          isSelected || isHovered || isContainer ? "opacity-100" : "pointer-events-none opacity-0"
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
        {(containerId !== null || containerOptions.length > 0) && (
          <DropdownMenu
            trigger={
              <span
                title="Move to…"
                aria-label="Move to a different container or the page's top level"
                className="flex items-center gap-0.5 rounded p-1 text-muted hover:bg-surface hover:text-foreground"
              >
                <MoveOutIcon className="h-3.5 w-3.5" />
                <ChevronDownIcon className="h-2.5 w-2.5" />
              </span>
            }
            items={[
              ...(containerId !== null ? [{ label: "Top level (page)", onSelect: () => onMoveOut(path) }] : []),
              ...containerOptions
                // Exclude the block's current container plus — when moving a
                // container itself — its own id and every nested descendant,
                // so it can never be dropped inside itself.
                .filter((c) => c.id !== containerId && !(isContainer && (c.id === block.id || descendantContainerIds(block).includes(c.id))))
                .map((c) => ({ label: `Into "${c.label}"`, onSelect: () => onMoveTo(path, c.id) })),
            ]}
          />
        )}
        <ConfirmIconButton label="Remove block" confirmText={`Remove "${def.label}" from the page?`} onConfirm={async () => onRemove(path)} />
      </div>

      {isContainer && (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand this container" : "Collapse this container"}
          title={collapsed ? "Expand" : "Collapse"}
          style={{ zIndex: controlsZIndex }}
          className="absolute -top-2.5 left-2 flex items-center gap-1 rounded-full border border-accent/40 bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent hover:bg-accent-soft"
        >
          <span aria-hidden="true" className={cn("transition-transform", collapsed ? "-rotate-90" : "")}>
            ▾
          </span>
          {block.name || "Container"} · {(block.config.layoutMode ?? "column").replace(/^./, (c) => c.toUpperCase())}
          {collapsed && !isEmptyContainer && (
            <span className="normal-case text-muted-foreground">({block.children.length})</span>
          )}
        </button>
      )}
      {!isContainer && block.name && (
        <span
          style={{ zIndex: controlsZIndex - 5 }}
          className="pointer-events-none absolute -top-2.5 left-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted"
        >
          {block.name}
        </span>
      )}
      {isEmptyContainer ? (
        <EmptyDropZone containerId={block.id} onClick={() => onSelect(path)} />
      ) : isContainer && collapsed ? (
        // Folded state: the whole nested subtree (which can be a lot of
        // rendered content once containers hold containers) is skipped
        // entirely rather than hidden with CSS, so a big layout stays fast
        // and scannable — click the chip above, or here, to expand again.
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-center rounded-lg border border-dashed border-accent/30 bg-accent/5 py-4 text-xs text-muted hover:border-accent/50"
        >
          {block.children.length} nested block{block.children.length === 1 ? "" : "s"} hidden — click to expand
        </button>
      ) : (
        <>
          {/* Editor-only dashed boundary so nesting is visible at a glance
              even when a container has no background of its own set — the
              guest-facing page-renderer.tsx never adds this, only the canvas. */}
          <div className={cn(isContainer && "rounded-lg outline-dashed outline-1 -outline-offset-1 outline-accent/30")}>
            <Render config={block.config} ctx={ctx} renderedChildren={renderedChildren} />
          </div>
          {/* Only non-container blocks get a full-cover "click anywhere to
              edit" overlay. A container previously got one too, sized to
              its whole box — since that box contains its own rendered
              children, the overlay sat on top of every nested block's own
              toolbar/edit-click area and silently ate the click before it
              ever reached them. A container is still editable via its own
              toolbar's edit (pencil) button; clicks inside its body now
              reach whatever's actually there. */}
          {!isContainer && (
            <button
              type="button"
              onClick={() => onSelect(path)}
              aria-label={`Edit ${def.label}`}
              className="absolute inset-0 z-10 cursor-pointer"
            />
          )}
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

// The other half of the empty-list fix: once a list has at least one block,
// there was previously NO way to drop after the last item at all — only
// existing items and the (now-hidden) empty placeholder were valid drop
// targets, so dragging a new component past the end of the list, or an
// existing block out of a container into open space, silently did nothing.
// This renders a slim, always-present strip using the exact same droppable
// id as the empty state, so page-builder.tsx's existing EMPTY_LIST_PREFIX
// handling covers both cases with no extra logic.
function EndOfListDropZone({ containerId }: { containerId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-6 items-center justify-center rounded-md border border-dashed text-[10px] font-medium uppercase tracking-wide transition-colors",
        isOver ? "border-accent bg-accent/5 text-accent" : "border-transparent text-transparent"
      )}
    >
      Drop here
    </div>
  );
}

export function EditableCanvas({
  blocks,
  ctx,
  selectedPath,
  onSelect,
  onRemove,
  onMoveOut,
  onMoveTo,
  containerOptions,
}: {
  blocks: BlockInstance[];
  ctx: PageRenderContext;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  onMoveOut: (path: BlockPath) => void;
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  containerOptions: ContainerOption[];
}) {
  // Tracks the single deepest block currently under the pointer — see the
  // note on EditableBlock's `hoveredPath` prop for why this replaced CSS
  // `:hover`/`group-hover` (which bubbles to every ancestor and made
  // nested blocks' toolbars overlap their containers').
  const [hoveredPath, setHoveredPath] = useState<BlockPath | null>(null);
  const onHoverEnd = (path: BlockPath) =>
    setHoveredPath((prev) => (prev?.containerId === path.containerId && prev?.blockId === path.blockId ? null : prev));

  if (blocks.length === 0) {
    return <EmptyDropZone containerId={null} />;
  }

  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-10 py-4" onMouseLeave={() => setHoveredPath(null)}>
        {blocks.map((block) => (
          <EditableBlock
            key={block.id}
            block={block}
            containerId={null}
            ctx={ctx}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onRemove={onRemove}
            onMoveOut={onMoveOut}
            onMoveTo={onMoveTo}
            containerOptions={containerOptions}
            hoveredPath={hoveredPath}
            onHover={setHoveredPath}
            onHoverEnd={onHoverEnd}
          />
        ))}
        <EndOfListDropZone containerId={null} />
      </div>
    </SortableContext>
  );
}
