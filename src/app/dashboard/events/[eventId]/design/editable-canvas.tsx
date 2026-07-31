"use client";

import { useState, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockInstance, BlockLayout, ContainerLayoutMode } from "@/lib/blocks/types";
import { resolveBlockLayout } from "@/lib/blocks/types";
import type { PageRenderContext } from "@/lib/blocks/context";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { layoutWrapperStyle } from "@/lib/blocks/layout-controls";
import type { DeviceWidth } from "./page-builder";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { DragHandleIcon, EditIcon, MoveOutIcon, ChevronDownIcon, CopyIcon, ClipboardListIcon } from "@/components/icons";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { emptyListId, startListId, type DropPlan } from "./dnd-ids";
import { cn } from "@/lib/cn";

// Renders as an absolutely-positioned overlay on the target block's own
// (already `position: relative`) wrapper — NOT a real flex/sortable list
// item. That distinction matters: an earlier version spliced this in as an
// actual sibling, which shifted every block below it in the flow every time
// the drop target changed. Since droppable rects are re-measured live during
// a drag, that shift fed straight back into collision detection — pointer
// stays still, the rect under it moves, collision detection sees a new
// "over" target, the indicator jumps again, shifting layout again — an
// infinite loop, which is exactly the "flickering like hell near the bottom
// edge" and the silently-failing nested drops this replaces. An absolutely
// positioned element contributes zero size to its flow parent, so it can
// never move anything else's rect, however often it appears or moves.
function InsertionBar({ orientation }: { orientation: "row" | "column" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-30 rounded-full bg-accent",
        orientation === "row" ? "-left-2.5 inset-y-1 w-1" : "-top-2.5 inset-x-1 h-1"
      )}
    />
  );
}

export type BlockPath = { containerId: string | null; blockId: string };
export type ContainerOption = { id: string; label: string };

// Every container id nested inside this block (not including the block's
// own id) — used to keep a container from being offered as a "Move to…"
// destination for itself.
function descendantContainerIds(block: BlockInstance): string[] {
  if (!("children" in block)) return [];
  return block.children.flatMap((c) => ("children" in c ? [c.id, ...descendantContainerIds(c)] : []));
}

// The real guest page enforces mobile/tablet/hiddenOnDesktop overrides via
// actual `@media` CSS (see blockResponsiveCss) since the server can't know
// a visitor's viewport ahead of render. The canvas instead already knows
// exactly which device is being simulated (the Desktop/Tablet/Mobile
// toggle) — a `@media` query here would evaluate against the real browser
// window, not the canvas's simulated device width, so it wouldn't preview
// correctly. Swapping the effective layout in JS, keyed off that same
// toggle, does.
function effectiveLayoutForDevice(
  layout: BlockLayout | undefined,
  device: DeviceWidth
): { layout: BlockLayout; hiddenForDevice: boolean } {
  const resolved = resolveBlockLayout(layout);
  if (device === "desktop") {
    return { layout: resolved, hiddenForDevice: Boolean(resolved.hiddenOnDesktop) };
  }
  // Tablet fields fall back to the mobile override field-by-field wherever
  // a tablet-specific value isn't set — matches blockResponsiveCss's own
  // merge (layout-controls.tsx) for the real guest page: a tablet held
  // "short side down" (portrait, this app's tablet range) is meant to look
  // like mobile by default, while "long side down" (landscape, 1024px+)
  // already lands outside the tablet range entirely and matches desktop
  // with zero configuration either way.
  //
  // `hidden` is resolved separately from align/width, same reasoning as
  // blockResponsiveCss's own split: unchecking "hide" always resolves back
  // to `undefined`, not `false`, so there's no way to represent "explicitly
  // visible on tablet" distinctly from "never configured" — falling back to
  // mobile's hidden state whenever ANY tablet override exists would silently
  // re-hide a block a host only meant to resize for tablet, with no way to
  // undo it. Falling back only when the tablet object is absent entirely
  // keeps the zero-config case (hide on mobile ⇒ hidden on tablet too by
  // default) while a host who's touched tablet at all keeps its own state.
  const override =
    device === "mobile" ? resolved.mobile : resolved.mobile || resolved.tablet ? { ...resolved.mobile, ...resolved.tablet } : undefined;
  if (!override) return { layout: resolved, hiddenForDevice: false };
  const hiddenForDevice =
    device === "mobile" ? Boolean(resolved.mobile?.hidden) : Boolean((resolved.tablet ? resolved.tablet.hidden : resolved.mobile?.hidden));
  return {
    layout: {
      ...resolved,
      align: override.align ?? resolved.align,
      width: override.width ?? resolved.width,
    },
    hiddenForDevice,
  };
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
  device,
  dropPlan,
  showInsertionBefore = false,
  onCopy,
  onPaste,
  hasClipboard,
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
  device: DeviceWidth;
  // Live "where would this land right now" from page-builder.tsx's
  // onDragOver — null whenever nothing is being dragged, or the current
  // hover position doesn't resolve to a valid drop.
  dropPlan: DropPlan;
  // True when the current drop would land immediately before this specific
  // block (computed by the parent from dropPlan.index vs. this block's
  // position in its own list) — draws the InsertionBar on this block's own
  // wrapper, oriented to match `parentLayoutMode`.
  showInsertionBefore?: boolean;
  // Copies this block (nested children included — see page-builder.tsx's
  // cloneBlockWithNewIds) into the editor's own in-memory clipboard.
  onCopy: (path: BlockPath) => void;
  // Pastes a fresh clone of whatever's in the clipboard directly after this
  // block, in this block's own list — "paste below", Form.io-style.
  onPaste: (path: BlockPath) => void;
  hasClipboard: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    transition: { duration: 150, easing: "ease" },
  });
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

  const { layout: effectiveLayout, hiddenForDevice } = effectiveLayoutForDevice(block.layout, device);

  // Matches the real guest page exactly: not shown at all, not a dimmed
  // ghost. Reach it to change this setting via the Outline panel (lists
  // every block regardless of per-device visibility) instead of the canvas.
  if (hiddenForDevice) return null;

  const wrapperStyle = {
    ...layoutWrapperStyle(effectiveLayout, parentLayoutMode),
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

  // This container is the current drop target (whether inserting between
  // two of its existing children, or appending at the end) whenever
  // dropPlan's containerId is this block's own id — regardless of the
  // resolved index, both cases mean "lands inside me."
  const isDropTarget = isContainer && dropPlan?.containerId === block.id;

  // Built entirely by the editor (never by the real guest page-renderer,
  // which constructs its own renderedChildren with no drop zones) — safe to
  // include an extra drop-target element alongside the actual child blocks.
  const renderedChildren: ReactNode[] | undefined =
    isContainer && !isEmptyContainer
      ? [
          <StartOfListDropZone key="start" containerId={block.id} />,
          <SortableContext key="children" items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {block.children.map((child, i) => (
              <EditableBlock
                key={child.id}
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
                device={device}
                dropPlan={dropPlan}
                showInsertionBefore={isDropTarget && dropPlan!.index === i}
                onCopy={onCopy}
                onPaste={onPaste}
                hasClipboard={hasClipboard}
              />
            ))}
          </SortableContext>,
          <EndOfListDropZone key="end" containerId={block.id} />,
        ]
      : undefined;

  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
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
            : isDropTarget
              ? "ring-2 ring-dashed ring-accent/60"
              : isHovered
                ? "ring-accent/30"
                : "ring-transparent"
        )}
      />
      {showInsertionBefore && <InsertionBar orientation={parentLayoutMode === "row" ? "row" : "column"} />}
      <div
        style={{ zIndex: controlsZIndex }}
        className={cn(
          "absolute -top-3.5 right-1 flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 shadow-sm transition-opacity",
          // Was permanently visible for containers (a 0-padding container
          // has no exposed background left to hover, which made its own
          // toolbar unreachable) — reverted now that the Outline mode
          // (outline-panel.tsx) is the reliable, spacing-independent way to
          // reach a container's Edit/Move/Delete actions regardless of its
          // padding/gap. Keeping this hover-gated for every block type,
          // container or not, is what keeps exactly one block's chrome
          // visible at a time (paired with the JS deepest-hover tracking
          // below) instead of two overlapping.
          isSelected || isHovered ? "opacity-100" : "pointer-events-none opacity-0"
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
        <button
          type="button"
          onClick={() => onCopy(path)}
          aria-label={`Copy ${def.label}`}
          title="Copy"
          className="rounded p-1 text-muted hover:bg-surface hover:text-foreground"
        >
          <CopyIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPaste(path)}
          disabled={!hasClipboard}
          aria-label="Paste below"
          title="Paste below"
          className="rounded p-1 text-muted hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ClipboardListIcon className="h-3.5 w-3.5" />
        </button>
        <ConfirmIconButton label="Remove block" confirmText={`Remove "${def.label}" from the page?`} onConfirm={async () => onRemove(path)} />
      </div>

      {isContainer && (
        // Was permanently visible (both for reachability at 0 padding and
        // to show the block's name) — now hover/selection-gated like the
        // toolbar above, for the same reason: two nested containers' chips
        // both anchor top-left, so at 0 padding they land at nearly the
        // same coordinates and become unreadable stacked on top of each
        // other (confirmed live, see the page builder plan doc). The
        // Outline mode is the reliable place to see every block's name and
        // structure regardless of spacing; this chip is now a quick visual
        // confirmation while directly interacting with one block, not the
        // only way to find out what something's called.
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand this container" : "Collapse this container"}
          title={collapsed ? "Expand" : "Collapse"}
          style={{ zIndex: controlsZIndex }}
          className={cn(
            "absolute -top-2.5 left-2 flex items-center gap-1 rounded-full border border-accent/40 bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent transition-opacity hover:bg-accent-soft",
            isSelected || isHovered || collapsed ? "opacity-100" : "pointer-events-none opacity-0"
          )}
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
          {/* flex-1 min-w-0: this div is a flex item of the outer
              wrapperStyle box above (display:flex, width:100%), and without
              its own grow/basis it defaults to flex:0 1 auto and shrink-wraps
              to content instead of filling that 100% — starving any block
              content that sizes itself off its own box (e.g. countdown.tsx's
              width-driven font sizing) of the real available width. */}
          <div
            className={cn(
              "min-w-0 flex-1",
              isContainer && "rounded-lg outline-dashed outline-1 -outline-offset-1 outline-accent/30"
            )}
          >
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
        // w-full: matches every other block type's own Render output
        // (container.tsx etc.), which is what lets a parent's row-share
        // sizing (layoutWrapperStyle) actually show through. Safe now that
        // that file's wrapper uses flexBasis: 0% + minWidth instead of
        // flexBasis: auto for the default row share — auto is what made a
        // w-full descendant circularly resolve to "claim the whole line";
        // 0% is a definite value so there's nothing to circularly resolve.
        "w-full rounded-xl border border-dashed p-6 text-center text-sm transition-colors",
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
      // flexBasis: "100%" is the standard trick for forcing a flex-wrap item
      // onto its own line — without it, this strip is a genuine third flex
      // sibling next to a row container's real children. It has no explicit
      // flex-grow, so it still claims its own (small) slice of the row's
      // width; since its border/text are transparent except while actively
      // hovered, that slice rendered as unexplained blank space eating into
      // the row's real columns (editor-only — the real guest page and
      // Preview mode render through PageRenderer, which has no such
      // element, so neither ever showed this).
      style={{ flexBasis: "100%" }}
      className={cn(
        "flex h-6 items-center justify-center rounded-md border border-dashed text-[10px] font-medium uppercase tracking-wide transition-colors",
        isOver ? "border-accent bg-accent/5 text-accent" : "border-transparent text-transparent"
      )}
    >
      Drop here
    </div>
  );
}

// The symmetric counterpart, rendered BEFORE the children — without this,
// landing something at the very top of a container meant precisely hovering
// its current first child's own (often small) row; hovering the
// container's own box always resolves to "append at the end" (see
// page-builder.tsx's resolveInsertionPoint), so there was no reliable,
// easy-to-hit target for "insert first" — especially dragging a brand-new
// block in from the palette, arriving from a completely different part of
// the screen with no existing sibling row to aim for yet.
function StartOfListDropZone({ containerId }: { containerId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: startListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      style={{ flexBasis: "100%" }}
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
  device,
  dropPlan,
  onCopy,
  onPaste,
  hasClipboard,
}: {
  blocks: BlockInstance[];
  ctx: PageRenderContext;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  onMoveOut: (path: BlockPath) => void;
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  containerOptions: ContainerOption[];
  device: DeviceWidth;
  dropPlan: DropPlan;
  onCopy: (path: BlockPath) => void;
  onPaste: (path: BlockPath) => void;
  hasClipboard: boolean;
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

  const isTopLevelDropTarget = dropPlan?.containerId === null;

  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-10 py-4" onMouseLeave={() => setHoveredPath(null)}>
        <StartOfListDropZone containerId={null} />
        {blocks.map((block, i) => (
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
            device={device}
            dropPlan={dropPlan}
            showInsertionBefore={isTopLevelDropTarget && dropPlan!.index === i}
            onCopy={onCopy}
            onPaste={onPaste}
            hasClipboard={hasClipboard}
          />
        ))}
        <EndOfListDropZone containerId={null} />
      </div>
    </SortableContext>
  );
}
