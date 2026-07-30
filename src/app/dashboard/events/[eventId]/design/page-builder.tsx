"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { updatePageSchema } from "../actions";
import { updateEvent } from "../../../actions";
import type { EventRecord } from "@/lib/data/events";
import type { FormSchema } from "@/lib/schemas/form-schema";
import type { BlockInstance, BlockType, PageSchema } from "@/lib/blocks/types";
import { BLOCK_REGISTRY, makeBlockInstance } from "@/lib/blocks/registry";
import { getTheme, resolveThemeColors, THEMES, type ThemeId, type ThemeColorOverrides } from "@/lib/themes";
import { resolveThemeFonts } from "@/lib/theme-fonts";
import { CustomPageFrame } from "@/lib/blocks/custom-page-frame";
import { PropertiesPanel, PageSettings, type CustomPageConfig } from "./properties-panel";
import { ComponentPalette, PALETTE_DRAG_PREFIX } from "./component-palette";
import { JsonSchemaEditor, type EditableSchema } from "./json-schema-editor";
import { BlockCard } from "./block-card";
import { EditableCanvas, type BlockPath } from "./editable-canvas";
import { EMPTY_LIST_PREFIX } from "./dnd-ids";
import { ArrowLeftIcon, CodeBracketsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { cn } from "@/lib/cn";

// Every tree-manipulation helper below is recursive so nesting depth is
// unlimited (containers can hold containers) — they originally only ever
// searched one level deep, which meant a container placed inside another
// container (buildable via the JSON code editor, since the schema itself
// has always allowed it — see lib/schemas/page-schema.ts's depth cap) was
// completely invisible to the visual builder: drag/drop, "Move to…", even
// simple lookups silently failed for anything nested two levels down.

// Recursively finds the children array belonging to the container with this
// id, wherever it lives in the tree.
function findContainerBlock(
  blocks: BlockInstance[],
  containerId: string
): Extract<BlockInstance, { children: BlockInstance[] }> | null {
  for (const b of blocks) {
    if (b.id === containerId) return "children" in b ? b : null;
    if ("children" in b) {
      const found = findContainerBlock(b.children, containerId);
      if (found) return found;
    }
  }
  return null;
}

function findContainerChildren(blocks: BlockInstance[], containerId: string): BlockInstance[] | null {
  return findContainerBlock(blocks, containerId)?.children ?? null;
}

function getBlockList(blocks: BlockInstance[], containerId: string | null): BlockInstance[] {
  if (containerId === null) return blocks;
  return findContainerChildren(blocks, containerId) ?? [];
}

function setBlockList(blocks: BlockInstance[], containerId: string | null, next: BlockInstance[]): BlockInstance[] {
  if (containerId === null) return next;
  return blocks.map((b) => {
    if (b.id === containerId) return "children" in b ? ({ ...b, children: next } as BlockInstance) : b;
    if ("children" in b) return { ...b, children: setBlockList(b.children, containerId, next) } as BlockInstance;
    return b;
  });
}

function findBlock(blocks: BlockInstance[], path: BlockPath | null): BlockInstance | null {
  if (!path) return null;
  return getBlockList(blocks, path.containerId).find((b) => b.id === path.blockId) ?? null;
}

// Finds which list (top-level, or a specific container's children, at any
// depth) a given block id currently lives in. Only ids actually mounted as
// a droppable/sortable item in the DOM can ever be `over` during a drag, so
// this doesn't need to know which nested lists are currently visible — if
// `id` resolves here, dnd-kit already found it as a real drop target.
function listContaining(id: string, blocks: BlockInstance[]): { containerId: string | null } | null {
  if (blocks.some((b) => b.id === id)) return { containerId: null };
  for (const b of blocks) {
    if ("children" in b) {
      if (b.children.some((c) => c.id === id)) return { containerId: b.id };
      const nested = listContaining(id, b.children);
      if (nested) return nested;
    }
  }
  return null;
}

function blockTypeAndLabelForId(blocks: BlockInstance[], id: string): { type: BlockType; label: string } | null {
  for (const b of blocks) {
    if (b.id === id) return { type: b.type, label: BLOCK_REGISTRY[b.type]?.label ?? b.type };
    if ("children" in b) {
      const found = blockTypeAndLabelForId(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Every container id in the tree — the block itself and its own descendants
// (used to keep a container from being offered as a "Move to…" destination
// for itself or for a block already inside it, which would create a cycle).
function collectContainerIds(block: BlockInstance): string[] {
  if (!("children" in block)) return [];
  return [block.id, ...block.children.flatMap(collectContainerIds)];
}

// All containers anywhere in the tree, indented by depth so a nested
// container's place in the hierarchy is visible in any destination list.
function collectContainerOptions(blocks: BlockInstance[], depth = 0): { id: string; label: string }[] {
  const options: { id: string; label: string }[] = [];
  for (const b of blocks) {
    if ("children" in b) {
      const indent = depth > 0 ? "—".repeat(depth) + " " : "";
      options.push({ id: b.id, label: `${indent}${b.name || BLOCK_REGISTRY[b.type]?.label || b.type}` });
      options.push(...collectContainerOptions(b.children, depth + 1));
    }
  }
  return options;
}

// pointerWithin resolves overlapping/nested droppables correctly (which
// container vs. which list you're actually over); it falls back to
// rectIntersection when the pointer isn't within any droppable rect yet
// (e.g. right at a drag's start) — plain closestCenter degrades once
// droppable zones vary in size or nest, which this layout does throughout.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

const ZOOM_MIN = 50;
const ZOOM_MAX = 150;
const ZOOM_STEP = 25;

// A plain visual zoom — `transform: scale()` shrinks/grows width and height
// together, proportionally, with no reflow. Simulating a *narrower device*
// (see DeviceWidthControl below) is a separate, independent control: that's
// the one that actually changes what width the content reflows at.
function ZoomControl({ zoom, onChange }: { zoom: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border">
      <button
        type="button"
        onClick={() => onChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
        disabled={zoom <= ZOOM_MIN}
        aria-label="Zoom out"
        className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onChange(100)}
        aria-label="Reset zoom to 100%"
        title="Reset zoom"
        className="w-11 text-center text-xs tabular-nums text-foreground hover:text-accent"
      >
        {zoom}%
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
        disabled={zoom >= ZOOM_MAX}
        aria-label="Zoom in"
        className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

export type DeviceWidth = "desktop" | "tablet" | "mobile";

// Caps the canvas content's own width so it actually reflows the way a real
// phone/tablet visitor would see it (the guest page has real breakpoints —
// see rsvp-form.tsx/venue-map.tsx) — independent of zoom, which only affects
// how big that already-reflowed layout appears.
const DEVICE_WIDTH_PX: Record<DeviceWidth, number | undefined> = {
  desktop: undefined,
  tablet: 768,
  mobile: 390,
};

const DEVICE_OPTIONS: { value: DeviceWidth; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

function ThemePicker({ themeId, onSelect }: { themeId: ThemeId; onSelect: (id: ThemeId) => void }) {
  const [open, setOpen] = useState(false);
  const current = getTheme(themeId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface"
      >
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" style={{ background: current.colors.accent }} />
        {current.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-background p-1 shadow-lg">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface",
                  t.id === themeId && "bg-surface"
                )}
              >
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" style={{ background: t.colors.accent }} />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PageBuilder({
  event,
  formSchema,
  initialSchema,
}: {
  event: EventRecord;
  formSchema: FormSchema;
  initialSchema: PageSchema;
}) {
  const initialCustomPage: CustomPageConfig =
    initialSchema.customPage ?? { enabled: false, html: "<p>Write your own page here.</p>", css: "", js: "" };

  const [blocks, setBlocks] = useState<BlockInstance[]>(initialSchema.blocks);
  const [pageStyle, setPageStyle] = useState(initialSchema.pageStyle ?? "");
  const [themeOverrides, setThemeOverrides] = useState<ThemeColorOverrides>(initialSchema.themeOverrides ?? {});
  const [fontFamily, setFontFamily] = useState(initialSchema.fontFamily ?? "");
  const [customPage, setCustomPage] = useState<CustomPageConfig>(initialCustomPage);
  const [liveEvent, setLiveEvent] = useState<EventRecord>(event);
  const [selectedPath, setSelectedPath] = useState<BlockPath | null>(null);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [device, setDevice] = useState<DeviceWidth>("desktop");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [eventSaveState, setEventSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const eventSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Compared against the current in-memory schema to drive the Save
  // button's unsaved-dot (docs/07 Phase 2) — updated on load and after
  // every successful save, not on every keystroke, so it's cheap.
  const [lastSavedJson, setLastSavedJson] = useState(() =>
    JSON.stringify({
      blocks: initialSchema.blocks,
      pageStyle: initialSchema.pageStyle ?? "",
      themeOverrides: initialSchema.themeOverrides ?? {},
      fontFamily: initialSchema.fontFamily ?? "",
      customPage: initialCustomPage,
    })
  );

  // @dnd-kit's DndContext assigns its aria-describedby id from a
  // module-level counter that isn't guaranteed to match between the
  // server-rendered HTML and the client's first render. Deferring the whole
  // drag-and-drop tree to post-mount avoids that hydration mismatch
  // entirely; this is an authenticated editor with no SEO/SSR content
  // value, so a static list for one paint is a fine trade.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Guards the debounced save's state updates below, not the save itself —
  // the pending `updateEvent` call still needs to fire and persist even if
  // the user navigates away inside the 700ms debounce window (dropping it
  // instead would silently discard a real edit); this just stops React from
  // touching state on a component that's no longer mounted by then.
  const isMountedRef = useRef(true);
  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const persistEvent = (next: EventRecord) => {
    if (eventSaveTimer.current) clearTimeout(eventSaveTimer.current);
    // Debounced so typing in a hero field doesn't fire a save per keystroke
    // — settles 700ms after the last edit, same event.id + full field set
    // `updateEvent` already requires everywhere else in the dashboard.
    eventSaveTimer.current = setTimeout(() => {
      if (isMountedRef.current) setEventSaveState("saving");
      updateEvent(next.id, {
        title: next.title,
        eventType: next.event_type,
        themeId: next.theme_id,
        eventDate: next.event_date ?? "",
        eventTime: next.event_time ?? "",
        venueName: next.venue_name ?? "",
        venueAddress: next.venue_address ?? "",
        subtitle: next.subtitle ?? "",
        description: next.description ?? "",
      }).then(() => {
        if (!isMountedRef.current) return;
        setEventSaveState("saved");
        setTimeout(() => {
          if (isMountedRef.current) setEventSaveState("idle");
        }, 1500);
      });
    }, 700);
  };

  const handleEventFieldsChange = (patch: Partial<EventRecord>) => {
    setLiveEvent((prev) => {
      const next = { ...prev, ...patch };
      persistEvent(next);
      return next;
    });
  };

  const currentJson = JSON.stringify({ blocks, pageStyle, themeOverrides, fontFamily, customPage });
  const isDirty = currentJson !== lastSavedJson;

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updatePageSchema(liveEvent.id, { version: 1, blocks, pageStyle, themeOverrides, fontFamily, customPage });
        setLastSavedJson(currentJson);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  const themeColors = resolveThemeColors(liveEvent.theme_id, themeOverrides);
  const themeFonts = resolveThemeFonts(liveEvent.theme_id);
  const selectedBlock = findBlock(blocks, selectedPath);

  const openBlock = (path: BlockPath) => {
    setPageSettingsOpen(false);
    setSelectedPath(path);
  };

  const openPageSettings = () => {
    setSelectedPath(null);
    setPageSettingsOpen(true);
  };

  const closeModal = () => {
    setSelectedPath(null);
    setPageSettingsOpen(false);
  };

  const handleChangeSelected = (next: BlockInstance) => {
    if (!selectedPath) return;
    const list = getBlockList(blocks, selectedPath.containerId);
    const nextList = list.map((b) => (b.id === selectedPath.blockId ? next : b));
    setBlocks(setBlockList(blocks, selectedPath.containerId, nextList));
  };

  const handleRemoveSelected = () => {
    if (!selectedPath) return;
    const list = getBlockList(blocks, selectedPath.containerId);
    const nextList = list.filter((b) => b.id !== selectedPath.blockId);
    setBlocks(setBlockList(blocks, selectedPath.containerId, nextList));
    setSelectedPath(null);
  };

  const handleRemoveBlock = (path: BlockPath) => {
    const list = getBlockList(blocks, path.containerId);
    setBlocks(setBlockList(blocks, path.containerId, list.filter((b) => b.id !== path.blockId)));
    if (selectedPath?.containerId === path.containerId && selectedPath?.blockId === path.blockId) {
      setSelectedPath(null);
    }
  };

  // Shared move logic: "Position" dropdown (moves whatever's currently
  // selected) and the canvas toolbar's one-click "Move out" button (moves a
  // specific block by path, independent of selection) both relocate a block
  // between containers/the top level without depending on drag-and-drop —
  // precise drag targets can be fiddly to hit (host feedback: "unable to
  // move to outer").
  const moveBlock = (path: BlockPath, destContainerId: string | null) => {
    if (destContainerId === path.containerId) return;
    const block = getBlockList(blocks, path.containerId).find((b) => b.id === path.blockId);
    if (!block) return;
    const withoutBlock = setBlockList(blocks, path.containerId, getBlockList(blocks, path.containerId).filter((b) => b.id !== block.id));
    setBlocks(setBlockList(withoutBlock, destContainerId, [...getBlockList(withoutBlock, destContainerId), block]));
    if (selectedPath?.containerId === path.containerId && selectedPath?.blockId === path.blockId) {
      setSelectedPath({ containerId: destContainerId, blockId: block.id });
    }
  };

  const handleMoveSelected = (destContainerId: string | null) => {
    if (!selectedPath) return;
    moveBlock(selectedPath, destContainerId);
  };

  const handleMoveOut = (path: BlockPath) => moveBlock(path, null);

  const containerOptions = collectContainerOptions(blocks);

  // The selected block's Layout section only shows the row-share/grid-span
  // ratio controls when it actually sits inside a row/grid container.
  const selectedParentContainer = selectedPath?.containerId
    ? findContainerBlock(blocks, selectedPath.containerId) ?? undefined
    : undefined;
  const selectedParentLayoutMode = selectedParentContainer?.config.layoutMode ?? (selectedParentContainer ? "column" : undefined);

  const currentSchema: EditableSchema = { blocks, pageStyle, themeOverrides, fontFamily, customPage };

  const handleApplyJsonSchema = (next: EditableSchema) => {
    setBlocks(next.blocks);
    setPageStyle(next.pageStyle ?? "");
    setThemeOverrides(next.themeOverrides ?? {});
    setFontFamily(next.fontFamily ?? "");
    setCustomPage(next.customPage ?? { enabled: false, html: "<p>Write your own page here.</p>", css: "", js: "" });
    // Ids may have been added/removed/renamed by hand — the old selection
    // path could point at nothing (or something else entirely) now.
    setSelectedPath(null);
    setCodeMode(false);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (activeId.startsWith(PALETTE_DRAG_PREFIX)) {
      const type = activeId.slice(PALETTE_DRAG_PREFIX.length) as BlockType;
      const newBlock = makeBlockInstance(type);

      // Dropped directly onto an empty list's placeholder.
      if (overId.startsWith(EMPTY_LIST_PREFIX)) {
        const raw = overId.slice(EMPTY_LIST_PREFIX.length);
        const targetContainerId = raw === "root" ? null : raw;
        setBlocks(setBlockList(blocks, targetContainerId, [...getBlockList(blocks, targetContainerId), newBlock]));
        return;
      }

      // Dropped directly onto a container's own box (coarse target, works
      // anywhere over its rendered area, not just a specific child) — append
      // into its children rather than inserting next to it.
      if (type !== "container") {
        const overContainer = blocks.find((b) => b.id === overId);
        if (overContainer && "children" in overContainer) {
          setBlocks(
            blocks.map((b) => (b.id === overContainer.id && "children" in b ? ({ ...b, children: [...b.children, newBlock] } as BlockInstance) : b))
          );
          return;
        }
      }

      // Otherwise insert at the hovered position within whichever list `over` belongs to.
      const target = listContaining(overId, blocks);
      if (!target) return;
      // Containers can't be nested inside another container — enforced here
      // too, not just by the palette UI, since a container could in
      // principle be dragged and dropped at a position inside a nested list.
      if (type === "container" && target.containerId !== null) return;
      const list = getBlockList(blocks, target.containerId);
      const index = list.findIndex((b) => b.id === overId);
      const nextList = [...list.slice(0, index), newBlock, ...list.slice(index)];
      setBlocks(setBlockList(blocks, target.containerId, nextList));
      return;
    }

    // Moving an existing block — within the same list (reorder), or across
    // lists entirely (drag out of/into a container, or between containers).
    // Mirrors the palette-insert resolution above: dropping directly onto a
    // different container's own box appends into it; dropping at a specific
    // position within a different (already-visible) list inserts it there;
    // dropping within the same list reorders as before. The "Position"
    // control in a block's modal remains as a non-drag alternative.
    const activeList = listContaining(activeId, blocks);
    if (!activeList) return;
    const movingBlock = getBlockList(blocks, activeList.containerId).find((b) => b.id === activeId);
    if (!movingBlock) return;
    const movingIsContainer = "children" in movingBlock;

    // Dropped onto a list's placeholder — either the "totally empty"
    // placeholder or the always-present end-of-list drop strip, both using
    // the same id scheme (see EndOfListDropZone in editable-canvas.tsx).
    // This case was previously unhandled entirely for moving an *existing*
    // block: that id never matches any real block id, so every check below
    // fell through to a silent no-op. That's the exact "can't drag an
    // existing block into a nested/empty container" bug. A moving
    // container is allowed here too (nested layouts), guarded against
    // dropping into itself or one of its own descendants.
    if (overId.startsWith(EMPTY_LIST_PREFIX)) {
      const raw = overId.slice(EMPTY_LIST_PREFIX.length);
      const targetContainerId = raw === "root" ? null : raw;
      const wouldCycle = movingIsContainer && collectContainerIds(movingBlock).includes(targetContainerId ?? "");
      if (targetContainerId !== activeList.containerId && !wouldCycle) {
        const withoutBlock = setBlockList(
          blocks,
          activeList.containerId,
          getBlockList(blocks, activeList.containerId).filter((b) => b.id !== activeId)
        );
        setBlocks(
          setBlockList(withoutBlock, targetContainerId, [...getBlockList(withoutBlock, targetContainerId), movingBlock])
        );
      }
      return;
    }

    if (!movingIsContainer) {
      const overContainer = blocks.find((b) => b.id === overId && b.id !== activeId);
      if (overContainer && "children" in overContainer && overContainer.id !== activeList.containerId) {
        const withoutBlock = setBlockList(
          blocks,
          activeList.containerId,
          getBlockList(blocks, activeList.containerId).filter((b) => b.id !== activeId)
        );
        setBlocks(
          setBlockList(withoutBlock, overContainer.id, [...getBlockList(withoutBlock, overContainer.id), movingBlock])
        );
        return;
      }
    }

    const overList = listContaining(overId, blocks);
    if (!overList) return;
    // A container CAN be dropped inside another container (nested layouts,
    // e.g. two column-containers inside a row-container) — the schema has
    // always allowed this depth (see lib/schemas/page-schema.ts's depth
    // cap) and hosts already build it via the JSON code editor; the drag
    // path just needs to refuse creating a cycle, i.e. never let a
    // container land inside itself or one of its own descendants.
    if (movingIsContainer && collectContainerIds(movingBlock).includes(overList.containerId ?? "")) return;

    if (activeList.containerId === overList.containerId) {
      const list = getBlockList(blocks, activeList.containerId);
      const oldIndex = list.findIndex((b) => b.id === activeId);
      const newIndex = list.findIndex((b) => b.id === overId);
      setBlocks(setBlockList(blocks, activeList.containerId, arrayMove(list, oldIndex, newIndex)));
      return;
    }

    // Cross-list move to a specific position: remove from the old list,
    // insert at the hovered index in the new one.
    const withoutBlock = setBlockList(
      blocks,
      activeList.containerId,
      getBlockList(blocks, activeList.containerId).filter((b) => b.id !== activeId)
    );
    const destList = getBlockList(withoutBlock, overList.containerId);
    const index = destList.findIndex((b) => b.id === overId);
    const nextDestList = [...destList.slice(0, index), movingBlock, ...destList.slice(index)];
    setBlocks(setBlockList(withoutBlock, overList.containerId, nextDestList));
  };

  const activeDrag =
    activeDragId && activeDragId.startsWith(PALETTE_DRAG_PREFIX)
      ? { type: activeDragId.slice(PALETTE_DRAG_PREFIX.length) as BlockType, label: BLOCK_REGISTRY[activeDragId.slice(PALETTE_DRAG_PREFIX.length) as BlockType]?.label ?? "" }
      : activeDragId
        ? blockTypeAndLabelForId(blocks, activeDragId)
        : null;

  const modalOpen = Boolean(selectedBlock) || pageSettingsOpen;
  const modalTitle = selectedBlock ? selectedBlock.name || BLOCK_REGISTRY[selectedBlock.type]?.label || selectedBlock.type : "Page settings";

  const canvas = (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Individually-scrollable columns so selecting a block near the
          bottom of a long page never hides the palette above or requires
          scrolling a separate settings panel into view — editing now opens
          in a modal (below) instead of a persistent third column. */}
      <div className="grid min-h-0 flex-1 grid-rows-[1fr] grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        <div className="flex min-h-0 flex-col rounded-lg border border-border bg-surface">
          <p className="shrink-0 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Components</p>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ComponentPalette onAdd={(type) => setBlocks((prev) => [...prev, makeBlockInstance(type)])} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4 py-2">
            <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">Live canvas</p>
            <div className="flex items-center gap-2">
              <ToggleGroup options={DEVICE_OPTIONS} value={device} onChange={(v) => setDevice(v as DeviceWidth)} />
              <ZoomControl zoom={zoom} onChange={setZoom} />
            </div>
          </div>
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto bg-[var(--t-bg)] px-6 py-4",
              themeFonts.bodyClassName,
              themeFonts.displayClassName
            )}
            style={
              {
                "--t-bg": themeColors.background,
                "--t-fg": themeColors.foreground,
                "--t-accent": themeColors.accent,
                "--t-accent-dark": themeColors.accentDark,
                "--t-surface": themeColors.surface,
                "--t-font-display": themeFonts.displayVar,
                "--t-font-body": themeFonts.bodyVar,
                fontFamily: "var(--t-font-body)",
              } as CSSProperties
            }
          >
            {/* Device width caps how wide the content is allowed to reflow
                (a real breakpoint test); zoom is a pure visual scale of
                whatever that reflowed layout looks like — the two combine
                without fighting because zoom wraps the device-width box
                rather than the other way around. */}
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
              <div style={{ maxWidth: DEVICE_WIDTH_PX[device] ? `${DEVICE_WIDTH_PX[device]}px` : undefined, margin: "0 auto" }}>
              {customPage.enabled ? (
                <CustomPageFrame
                  {...customPage}
                  shortcodes={{
                    eventId: liveEvent.id,
                    inviteId: "preview",
                    venueName: liveEvent.venue_name,
                    venueAddress: liveEvent.venue_address,
                    schema: formSchema,
                  }}
                />
              ) : (
                <div style={{ fontFamily: fontFamily || undefined }}>
                  <EditableCanvas
                    blocks={blocks}
                    ctx={{
                      event: liveEvent,
                      inviteId: "preview",
                      guestName: "Guest Name",
                      schema: formSchema,
                      initialResponses: null,
                    }}
                    selectedPath={selectedPath}
                    onSelect={openBlock}
                    onRemove={handleRemoveBlock}
                    onMoveOut={handleMoveOut}
                    containerOptions={containerOptions}
                    onMoveTo={moveBlock}
                  />
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDrag ? <BlockCard type={activeDrag.type} title={activeDrag.label} className="shadow-lg" /> : null}
      </DragOverlay>
    </DndContext>
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <Link href={`/dashboard/events/${liveEvent.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to event
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Page builder</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={openPageSettings}>
              Page settings
            </Button>
            <ThemePicker themeId={liveEvent.theme_id} onSelect={(themeId) => handleEventFieldsChange({ theme_id: themeId })} />
            <Button type="button" variant="secondary" size="sm" onClick={() => setCodeMode((v) => !v)}>
              <CodeBracketsIcon className="h-4 w-4" />
              {codeMode ? "Visual builder" : "Code"}
            </Button>
          </div>
          <div className="flex items-center gap-3 border-l border-border pl-4">
            {eventSaveState === "saving" && <span className="text-xs text-muted">Saving…</span>}
            {eventSaveState === "saved" && <span className="text-xs text-success">Saved.</span>}
            {saved && <span className="text-sm text-success">Saved.</span>}
            {error && <span className="text-sm font-medium text-destructive">{error}</span>}
            <Button onClick={handleSave} loading={isPending} className="relative">
              {isDirty && !isPending && (
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warning"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                />
              )}
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* min-h-0 so this grid row shrinks to fit the flex column above
          instead of growing past it (the classic flex/grid child overflow
          trap) — its children then stretch to fill it (grid's default
          align-items) and scroll internally, with no outer page scroll.
          grid-rows-[1fr] is required too: with no explicit row height, a
          single-row grid sizes that row to its content (auto), not to the
          container's own flex-1 height — "stretch" only stretches items
          within the row's height, it doesn't grow the row itself. Without
          this, short content (few blocks) left dead space below the
          panels instead of the panels filling the viewport. */}
      {codeMode ? (
        <JsonSchemaEditor value={currentSchema} onApply={handleApplyJsonSchema} onCancel={() => setCodeMode(false)} />
      ) : mounted ? (
        canvas
      ) : (
        <div className="grid min-h-0 flex-1 grid-rows-[1fr] grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
          <div className="rounded-lg border border-border bg-surface" />
          <div className="rounded-lg border border-border" />
        </div>
      )}

      {/* Every block's edit modal renders at the same fixed size/layout
          (settings on the left, live preview on the right) regardless of
          how many fields that block type has — consistency across block
          types, and the preview stays visible while adjusting settings. */}
      <Modal open={modalOpen} onClose={closeModal} title={modalTitle} size="full" className="flex h-[90vh] flex-col">
        {selectedBlock ? (
          <PropertiesPanel
            selectedBlock={selectedBlock}
            onChangeSelected={handleChangeSelected}
            onRemoveSelected={handleRemoveSelected}
            event={liveEvent}
            onEventFieldsChange={handleEventFieldsChange}
            ctx={{
              event: liveEvent,
              inviteId: "preview",
              guestName: "Guest Name",
              schema: formSchema,
              initialResponses: null,
            }}
            themeColors={themeColors}
            fontFamily={fontFamily}
            currentContainerId={selectedPath?.containerId ?? null}
            parentLayoutMode={selectedParentLayoutMode}
            containerOptions={containerOptions.filter((c) => c.id !== selectedBlock.id)}
            onMoveTo={handleMoveSelected}
          />
        ) : pageSettingsOpen ? (
          <PageSettings
            themeId={liveEvent.theme_id}
            themeOverrides={themeOverrides}
            onThemeOverridesChange={setThemeOverrides}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            pageStyle={pageStyle}
            onPageStyleChange={setPageStyle}
            customPage={customPage}
            onCustomPageChange={setCustomPage}
          />
        ) : null}
      </Modal>
    </div>
  );
}
