"use client";

import { Fragment, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import type { BlockInstance } from "@/lib/blocks/types";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { BlockTypeBadge } from "./block-card";
import type { BlockPath, ContainerOption } from "./editable-canvas";
import { emptyListId, startListId, type DropPlan } from "./dnd-ids";

// A thin accent line showing exactly where a drag would land right now —
// the Outline's own version of editable-canvas.tsx's InsertionBar. Unlike
// that one, this needs no absolute positioning to avoid a layout-shift
// feedback loop: rows here are a plain vertical block list (space-y-*), not
// row-direction flex, so a normal flow element between two rows doesn't
// create the same circular-sizing/collision-detection problem a flex-wrap
// row's children did.
function OutlineInsertionLine({ depth }: { depth: number }) {
  return <div aria-hidden="true" style={{ marginLeft: depth * 20 }} className="my-0.5 h-0.5 rounded-full bg-accent" />;
}
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DragHandleIcon, ChevronDownIcon, MoveOutIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

// The structural counterpart to the visual canvas: every row here is a
// normal block-level list item in document flow — no `position: absolute`
// anywhere in this file. Two adjacent blocks can never visually collide
// here regardless of how tightly (or not at all) their *rendered content*
// is spaced, which is exactly the property the canvas's floating chrome
// couldn't guarantee once a host set padding/gap to 0 (see the page
// builder's plan doc / SAAS_PLAN.md for the incident this replaced).
// Renaming, selecting, reordering, and moving between containers all call
// the exact same handlers the canvas and the block's own edit modal use —
// this is a different presentation of the same state, not a parallel system.

function descendantContainerIds(block: BlockInstance): string[] {
  if (!("children" in block)) return [];
  return block.children.flatMap((c) => ("children" in c ? [c.id, ...descendantContainerIds(c)] : []));
}

function OutlineEmptyDropZone({ containerId, depth }: { containerId: string; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: (depth + 1) * 20 }}
      className={cn(
        "rounded-md border border-dashed px-2 py-1.5 text-xs",
        isOver ? "border-accent bg-accent-soft text-accent" : "border-border text-muted-foreground"
      )}
    >
      Empty — drag a component here, or add one from the palette
    </div>
  );
}

// The non-empty counterpart to OutlineEmptyDropZone — without this, a list
// with at least one row already in it had no droppable at all past its last
// item, so dragging a block to the end of a container (or the end of the
// top-level page) here silently did nothing, unlike the visual canvas
// (editable-canvas.tsx's EndOfListDropZone), which already has this. Same
// id scheme (emptyListId) as the empty-state zone above, so page-builder.tsx's
// existing EMPTY_LIST_PREFIX resolution handles both with no extra logic.
function OutlineEndOfListDropZone({ containerId, depth }: { containerId: string | null; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: (depth + 1) * 20 }}
      className={cn(
        "flex h-4 items-center rounded-md border border-dashed text-[10px] uppercase tracking-wide transition-colors",
        isOver ? "border-accent bg-accent-soft px-2 text-accent" : "border-transparent text-transparent"
      )}
    >
      Drop here
    </div>
  );
}

// Symmetric counterpart, rendered before the children — see the matching
// comment on editable-canvas.tsx's StartOfListDropZone for why the
// container's own box alone (always "append at end") isn't enough to
// reliably land something at the very top of a list.
function OutlineStartOfListDropZone({ containerId, depth }: { containerId: string | null; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: startListId(containerId) });
  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: (depth + 1) * 20 }}
      className={cn(
        "flex h-4 items-center rounded-md border border-dashed text-[10px] uppercase tracking-wide transition-colors",
        isOver ? "border-accent bg-accent-soft px-2 text-accent" : "border-transparent text-transparent"
      )}
    >
      Drop here
    </div>
  );
}

function OutlineRow({
  block,
  containerId,
  depth,
  selectedPath,
  onSelect,
  onRemove,
  onMoveOut,
  onMoveTo,
  onRename,
  containerOptions,
  dropPlan,
}: {
  block: BlockInstance;
  containerId: string | null;
  depth: number;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  onMoveOut: (path: BlockPath) => void;
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  onRename: (path: BlockPath, name: string) => void;
  containerOptions: ContainerOption[];
  dropPlan: DropPlan;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    transition: { duration: 150, easing: "ease" },
  });
  const def = BLOCK_REGISTRY[block.type];
  const path: BlockPath = { containerId, blockId: block.id };
  const isSelected = selectedPath?.containerId === containerId && selectedPath?.blockId === block.id;
  const isContainer = "children" in block;
  const [expanded, setExpanded] = useState(true);
  const [nameDraft, setNameDraft] = useState(block.name ?? "");

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div
        style={{ paddingLeft: depth * 20 }}
        className={cn(
          "flex items-center gap-1.5 rounded-md border py-1.5 pr-1.5 transition-colors",
          isSelected ? "border-accent bg-accent-soft" : "border-transparent hover:bg-surface-hover"
        )}
      >
        <span
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={0}
          aria-label="Drag to reorder"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted hover:bg-surface hover:text-foreground active:cursor-grabbing"
        >
          <DragHandleIcon className="h-3.5 w-3.5" />
        </span>

        {isContainer ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
            className="shrink-0 rounded p-0.5 text-muted hover:bg-surface hover:text-foreground"
          >
            <ChevronDownIcon className={cn("h-3.5 w-3.5 transition-transform", !expanded && "-rotate-90")} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <BlockTypeBadge type={block.type} className="h-6 w-6 shrink-0" />

        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            if (nameDraft !== (block.name ?? "")) onRename(path, nameDraft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder={def?.label ?? block.type}
          aria-label="Block name"
          className="min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm text-foreground hover:border-border focus:border-accent focus:bg-background focus:outline-none"
        />

        {isContainer && (
          <span className="hidden shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground sm:inline">
            {(block.config.layoutMode ?? "column").replace(/^./, (c) => c.toUpperCase())}
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelect(path)}
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          Edit
        </button>

        {(containerId !== null || containerOptions.length > 0) && (
          <DropdownMenu
            trigger={
              <span
                title="Move to…"
                aria-label="Move to a different container or the page's top level"
                className="flex shrink-0 items-center rounded p-1 text-muted hover:bg-surface hover:text-foreground"
              >
                <MoveOutIcon className="h-3.5 w-3.5" />
              </span>
            }
            items={[
              ...(containerId !== null ? [{ label: "Top level (page)", onSelect: () => onMoveOut(path) }] : []),
              ...containerOptions
                .filter((c) => c.id !== containerId && !(isContainer && (c.id === block.id || descendantContainerIds(block).includes(c.id))))
                .map((c) => ({ label: `Into "${c.label}"`, onSelect: () => onMoveTo(path, c.id) })),
            ]}
          />
        )}

        <ConfirmIconButton
          label="Remove block"
          confirmText={`Remove "${block.name || def?.label || block.type}" from the page?`}
          onConfirm={async () => onRemove(path)}
        />
      </div>

      {isContainer && expanded && (
        <div className="space-y-0.5">
          {block.children.length === 0 ? (
            <OutlineEmptyDropZone containerId={block.id} depth={depth} />
          ) : (
            <SortableContext items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <OutlineStartOfListDropZone containerId={block.id} depth={depth} />
              {block.children.map((child, i) => (
                <Fragment key={child.id}>
                  {dropPlan?.containerId === block.id && dropPlan.index === i && <OutlineInsertionLine depth={depth + 1} />}
                  <OutlineRow
                    block={child}
                    containerId={block.id}
                    depth={depth + 1}
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onMoveOut={onMoveOut}
                    onMoveTo={onMoveTo}
                    onRename={onRename}
                    containerOptions={containerOptions}
                    dropPlan={dropPlan}
                  />
                </Fragment>
              ))}
              {dropPlan?.containerId === block.id && dropPlan.index === block.children.length && (
                <OutlineInsertionLine depth={depth + 1} />
              )}
            </SortableContext>
          )}
          {block.children.length > 0 && <OutlineEndOfListDropZone containerId={block.id} depth={depth} />}
        </div>
      )}
    </div>
  );
}

export function OutlinePanel({
  blocks,
  selectedPath,
  onSelect,
  onRemove,
  onMoveOut,
  onMoveTo,
  onRename,
  containerOptions,
  dropPlan,
}: {
  blocks: BlockInstance[];
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  onMoveOut: (path: BlockPath) => void;
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  onRename: (path: BlockPath, name: string) => void;
  containerOptions: ContainerOption[];
  dropPlan: DropPlan;
}) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        No blocks yet — add one from the Components panel.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <OutlineStartOfListDropZone containerId={null} depth={0} />
        {blocks.map((block, i) => (
          <Fragment key={block.id}>
            {dropPlan?.containerId === null && dropPlan.index === i && <OutlineInsertionLine depth={0} />}
            <OutlineRow
              block={block}
              containerId={null}
              depth={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onRemove={onRemove}
              onMoveOut={onMoveOut}
              onMoveTo={onMoveTo}
              onRename={onRename}
              containerOptions={containerOptions}
              dropPlan={dropPlan}
            />
          </Fragment>
        ))}
        {dropPlan?.containerId === null && dropPlan.index === blocks.length && <OutlineInsertionLine depth={0} />}
      </SortableContext>
      <OutlineEndOfListDropZone containerId={null} depth={0} />
    </div>
  );
}
