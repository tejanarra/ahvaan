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

function getBlockList(blocks: BlockInstance[], containerId: string | null): BlockInstance[] {
  if (containerId === null) return blocks;
  const container = blocks.find((b) => b.id === containerId);
  return container && "children" in container ? container.children : [];
}

function setBlockList(blocks: BlockInstance[], containerId: string | null, next: BlockInstance[]): BlockInstance[] {
  if (containerId === null) return next;
  return blocks.map((b) => (b.id === containerId && "children" in b ? ({ ...b, children: next } as BlockInstance) : b));
}

function findBlock(blocks: BlockInstance[], path: BlockPath | null): BlockInstance | null {
  if (!path) return null;
  return getBlockList(blocks, path.containerId).find((b) => b.id === path.blockId) ?? null;
}

// Finds which list (top-level, or a specific container's children) a given
// block id currently lives in. Only ids actually mounted as a droppable/
// sortable item in the DOM can ever be `over` during a drag, so this doesn't
// need to know which nested lists are currently visible — if `id` resolves
// here, dnd-kit already found it as a real drop target.
function listContaining(id: string, blocks: BlockInstance[]): { containerId: string | null } | null {
  if (blocks.some((b) => b.id === id)) return { containerId: null };
  for (const b of blocks) {
    if ("children" in b && b.children.some((c) => c.id === id)) return { containerId: b.id };
  }
  return null;
}

function blockTypeAndLabelForId(blocks: BlockInstance[], id: string): { type: BlockType; label: string } | null {
  const top = blocks.find((b) => b.id === id);
  if (top) return { type: top.type, label: BLOCK_REGISTRY[top.type]?.label ?? top.type };
  for (const b of blocks) {
    if ("children" in b) {
      const child = b.children.find((c) => c.id === id);
      if (child) return { type: child.type, label: BLOCK_REGISTRY[child.type]?.label ?? child.type };
    }
  }
  return null;
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
  const [blocks, setBlocks] = useState<BlockInstance[]>(initialSchema.blocks);
  const [pageStyle, setPageStyle] = useState(initialSchema.pageStyle ?? "");
  const [themeOverrides, setThemeOverrides] = useState<ThemeColorOverrides>(initialSchema.themeOverrides ?? {});
  const [fontFamily, setFontFamily] = useState(initialSchema.fontFamily ?? "");
  const [customPage, setCustomPage] = useState<CustomPageConfig>(
    initialSchema.customPage ?? { enabled: false, html: "<p>Write your own page here.</p>", css: "", js: "" }
  );
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

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updatePageSchema(liveEvent.id, { version: 1, blocks, pageStyle, themeOverrides, fontFamily, customPage });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  const themeColors = resolveThemeColors(liveEvent.theme_id, themeOverrides);
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

  const handleMoveSelected = (destContainerId: string | null) => {
    if (!selectedPath || destContainerId === selectedPath.containerId) return;
    const block = findBlock(blocks, selectedPath);
    if (!block) return;
    const withoutBlock = setBlockList(
      blocks,
      selectedPath.containerId,
      getBlockList(blocks, selectedPath.containerId).filter((b) => b.id !== block.id)
    );
    const finalBlocks = setBlockList(withoutBlock, destContainerId, [...getBlockList(withoutBlock, destContainerId), block]);
    setBlocks(finalBlocks);
    setSelectedPath({ containerId: destContainerId, blockId: block.id });
  };

  const containerOptions = blocks
    .filter((b): b is Extract<BlockInstance, { children: BlockInstance[] }> => "children" in b)
    .map((b) => ({ id: b.id, label: BLOCK_REGISTRY[b.type]?.label ?? b.type }));

  // The selected block's Layout section only shows the row-share/grid-span
  // ratio controls when it actually sits inside a row/grid container.
  const selectedParentContainer = selectedPath?.containerId
    ? blocks.find((b): b is Extract<BlockInstance, { children: BlockInstance[] }> => "children" in b && b.id === selectedPath.containerId)
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
    // Containers only ever live at the top level — never drop one inside
    // another container's children.
    if (movingIsContainer && overList.containerId !== null) return;

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
  const modalTitle = selectedBlock ? BLOCK_REGISTRY[selectedBlock.type]?.label ?? selectedBlock.type : "Page settings";

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
            className="min-h-0 flex-1 overflow-auto bg-[var(--t-bg)] px-6 py-4"
            style={
              {
                "--t-bg": themeColors.background,
                "--t-fg": themeColors.foreground,
                "--t-accent": themeColors.accent,
                "--t-accent-dark": themeColors.accentDark,
                "--t-surface": themeColors.surface,
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
                <CustomPageFrame {...customPage} />
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
            <Button onClick={handleSave} loading={isPending}>
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
