"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import type { BlockInstance } from "@/lib/blocks/types";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { BlockTypeBadge } from "./block-card";
import type { BlockPath, ContainerOption } from "./editable-canvas";
import { emptyListId } from "./dnd-ids";
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
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
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
              {block.children.map((child) => (
                <OutlineRow
                  key={child.id}
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
                />
              ))}
            </SortableContext>
          )}
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
}: {
  blocks: BlockInstance[];
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onRemove: (path: BlockPath) => void;
  onMoveOut: (path: BlockPath) => void;
  onMoveTo: (path: BlockPath, destContainerId: string | null) => void;
  onRename: (path: BlockPath, name: string) => void;
  containerOptions: ContainerOption[];
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
        {blocks.map((block) => (
          <OutlineRow
            key={block.id}
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
          />
        ))}
      </SortableContext>
    </div>
  );
}
