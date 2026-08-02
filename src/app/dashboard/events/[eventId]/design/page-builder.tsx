"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
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
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { updatePageSchema } from "../actions";
import { updateEvent } from "../../../actions";
import type { EventRecord } from "@/lib/data/events";
import type { FormSchema } from "@/lib/schemas/form-schema";
import type { BlockInstance, BlockType, PageSchema } from "@/lib/blocks/types";
import { BLOCK_REGISTRY, makeBlockInstance } from "@/lib/blocks/registry";
import { makeStarterLayout } from "@/lib/blocks/starter-layouts";
import { getTheme, resolveThemeColors, THEMES, type ThemeId, type ThemeColorOverrides } from "@/lib/themes";
import { resolveThemeFonts } from "@/lib/theme-fonts";
import { CustomPageFrame } from "@/lib/blocks/custom-page-frame";
import { PropertiesPanel, PageSettings, type CustomPageConfig } from "./properties-panel";
import { ComponentPalette, PALETTE_DRAG_PREFIX } from "./component-palette";
import { JsonSchemaEditor, type EditableSchema } from "./json-schema-editor";
import { BlockCard } from "./block-card";
import { EditableCanvas, type BlockPath } from "./editable-canvas";
import { OutlinePanel } from "./outline-panel";
import { PreviewFrame } from "./preview-frame";
import { PageRenderer } from "@/lib/blocks/page-renderer";
import type { CustomComponentMap } from "@/lib/blocks/context";
import type { CustomComponentRecord } from "@/lib/data/custom-components";
import { EMPTY_LIST_PREFIX, START_LIST_PREFIX, type DropPlan } from "./dnd-ids";
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

// Deep-clones a block (and, for containers, every nested descendant) with a
// fresh id at every level — every block id must be unique across the whole
// tree (see findBlock/listContaining, which look blocks up by id and take
// the first match), so pasting a raw copy of the original tree verbatim
// would silently break selection/lookup for both the pasted copy and the
// original it now collides with. `name` is dropped too: keeping it would
// make two blocks share a human-picked label, which is exactly the
// ambiguity a name is meant to resolve (see collectContainerOptions).
function cloneBlockWithNewIds(block: BlockInstance): BlockInstance {
  const { name: _name, ...rest } = block;
  const cloned = { ...rest, id: crypto.randomUUID() } as BlockInstance;
  return "children" in cloned ? ({ ...cloned, children: cloned.children.map(cloneBlockWithNewIds) } as BlockInstance) : cloned;
}

// How many additional container levels a block's own subtree adds — 0 for a
// leaf or an empty container, otherwise 1 + the deepest child's own count.
// Used to keep paste from silently exceeding the schema's own nesting cap
// (see MAX_CONTAINER_DEPTH below): unlike a drag (computeDropPlan already
// checks this for palette containers), a copied container can already be
// several levels deep on its own, and pasting it into an already-nested
// location can push the combined depth past what the schema accepts — that
// wouldn't fail until the next Save, with no indication paste was the cause.
function subtreeDepth(block: BlockInstance): number {
  if (!("children" in block) || block.children.length === 0) return 0;
  return 1 + Math.max(...block.children.map(subtreeDepth));
}

// Matches lib/schemas/page-schema.ts's own nesting cap (duplicated there and
// in json-schema-editor.tsx, same reasoning as those: cheap to keep in sync
// by hand, and importing the zod schema module here just to read one number
// would pull server-only validation code into this client component).
const MAX_CONTAINER_DEPTH = 8;

// How many containers deep `containerId` sits (0 = top level) — used to stop
// a drag from nesting a container past the schema's own depth cap.
function containerDepth(blocks: BlockInstance[], containerId: string, depth = 0): number | null {
  for (const b of blocks) {
    if (b.id === containerId) return depth;
    if ("children" in b) {
      const found = containerDepth(b.children, containerId, depth + 1);
      if (found !== null) return found;
    }
  }
  return null;
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

// Resolves `overId` (whatever dnd-kit's collision detection currently
// considers "under the pointer") to a single, unambiguous drop point: which
// list (containerId) and which index within it. A container's own box and
// its end-of-list strip both mean the same thing — "append inside this
// container" — so both simply resolve to index === that container's current
// child count; there's no separate "nest" case to keep in sync with sibling
// insertion. The start-of-list strip is the one explicit exception: it
// always means index 0 of that same list, regardless of child count.
function resolveInsertionPoint(blocks: BlockInstance[], overId: string): { containerId: string | null; index: number } | null {
  if (overId.startsWith(EMPTY_LIST_PREFIX)) {
    const raw = overId.slice(EMPTY_LIST_PREFIX.length);
    const containerId = raw === "root" ? null : raw;
    return { containerId, index: getBlockList(blocks, containerId).length };
  }
  if (overId.startsWith(START_LIST_PREFIX)) {
    const raw = overId.slice(START_LIST_PREFIX.length);
    return { containerId: raw === "root" ? null : raw, index: 0 };
  }
  const overContainer = findContainerBlock(blocks, overId);
  if (overContainer) return { containerId: overContainer.id, index: overContainer.children.length };
  const target = listContaining(overId, blocks);
  if (!target) return null;
  const list = getBlockList(blocks, target.containerId);
  const index = list.findIndex((b) => b.id === overId);
  if (index === -1) return null;
  return { containerId: target.containerId, index };
}

// The single source of truth for "where would this drag land right now" —
// used identically for the live preview (onDragOver, drives the insertion
// indicator in editable-canvas.tsx) and the actual commit (onDragEnd), so
// what the user sees while dragging is guaranteed to match what happens on
// drop. Returns null for geometrically-unresolvable or business-rule-invalid
// targets (e.g. nesting a container inside itself) — callers treat that as
// "no valid drop here" (no indicator shown; onDragEnd no-ops).
function computeDropPlan(
  blocks: BlockInstance[],
  activeId: string,
  overId: string
): { containerId: string | null; index: number } | null {
  if (activeId === overId) return null;

  if (activeId.startsWith(PALETTE_DRAG_PREFIX)) {
    const type = activeId.slice(PALETTE_DRAG_PREFIX.length) as BlockType;
    const point = resolveInsertionPoint(blocks, overId);
    if (!point) return null;
    // A brand-new container CAN be dropped straight into an existing one
    // (nested layouts are a first-class case — see the depth-cap comment on
    // MAX_CONTAINER_DEPTH above) — only refuse it once nesting one more
    // level would exceed the schema's own cap.
    if (type === "container" && point.containerId !== null) {
      const depth = containerDepth(blocks, point.containerId) ?? 0;
      if (depth + 1 >= MAX_CONTAINER_DEPTH) return null;
    }
    return point;
  }

  const activeList = listContaining(activeId, blocks);
  if (!activeList) return null;
  const movingBlock = getBlockList(blocks, activeList.containerId).find((b) => b.id === activeId);
  if (!movingBlock) return null;
  const movingIsContainer = "children" in movingBlock;

  const point = resolveInsertionPoint(blocks, overId);
  if (!point) return null;

  // Refuse to drop a container inside itself or one of its own descendants.
  if (movingIsContainer && collectContainerIds(movingBlock).includes(point.containerId ?? "")) return null;

  return point;
}

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

// Preview mode's device widths, for PreviewFrame — unlike DEVICE_WIDTH_PX
// above (a max-width cap on a div still laid out in the dashboard's real
// window), these size an actual iframe viewport, so real `@media` per-device
// overrides (blockResponsiveCss) evaluate correctly there. "desktop" needs a
// concrete number here (an iframe can't have an "uncapped" width) — 1280px
// comfortably clears TABLET_MAX_PX (1023, see lib/blocks/types.ts) so it
// reliably lands in the real guest page's desktop range.
const PREVIEW_FRAME_WIDTH: Record<DeviceWidth, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

const DEVICE_OPTIONS: { value: DeviceWidth; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

// Edit: the interactive click-to-place canvas (unchanged). Outline: a
// structural tree list, immune to the page's own padding/gap since it's
// plain document flow (see outline-panel.tsx) — the reliable way to
// identify/rename/reorder/move blocks once tight spacing makes the visual
// canvas's floating chrome hard to target. Preview: the exact guest-facing
// render (PageRenderer, the same component /e/[slug] uses) with zero
// editor chrome, to answer "does my 0-padding layout actually look right."
export type CanvasMode = "edit" | "outline" | "preview";

const CANVAS_MODE_OPTIONS: { value: CanvasMode; label: string }[] = [
  { value: "edit", label: "Edit" },
  { value: "outline", label: "Outline" },
  { value: "preview", label: "Preview" },
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
  customComponents,
}: {
  event: EventRecord;
  formSchema: FormSchema;
  initialSchema: PageSchema;
  // The host's saved component library (see lib/data/custom-components.ts) —
  // a naming field on the Custom HTML/CSS/JS block's own Edit panel is what
  // adds to it (on the next page save); this is just read here, to resolve
  // <custom-component name="..."> tags at render/preview time.
  customComponents: CustomComponentRecord[];
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
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("edit");
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
  const [dropPlan, setDropPlan] = useState<DropPlan>(null);
  // The copied block itself (not just its id) — a plain in-memory clipboard
  // scoped to this editor session, not the OS clipboard: pasting always
  // re-clones with fresh ids (see cloneBlockWithNewIds) so copying once and
  // pasting repeatedly never collides ids across pastes, and there's no
  // need to serialize/deserialize or worry about stale ids if the original
  // block is edited or deleted after being copied.
  const [clipboardBlock, setClipboardBlock] = useState<BlockInstance | null>(null);

  // Preview mode's iframe (PreviewFrame) is a fixed, real pixel width per
  // device — unlike Edit mode's content, which just reflows to whatever
  // space the pane has, that fixed width doesn't auto-shrink to fit a
  // narrower pane (e.g. this dashboard's own 300px palette column eating
  // into it). Left at 100% zoom, a 1280px-wide Desktop preview would
  // overflow/look oversized in a pane that has much less room — so this
  // measures the pane and picks a starting zoom that fits it, once per
  // mode/device switch (not continuously, so it doesn't fight a zoom level
  // the user deliberately picked afterward).
  const previewPaneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (canvasMode !== "preview" || customPage.enabled) return;
    const el = previewPaneRef.current;
    if (!el) return;
    const available = el.clientWidth - 48; // px-6 padding on both sides
    const frameWidth = PREVIEW_FRAME_WIDTH[device];
    const fit = Math.min(100, Math.round((available / frameWidth) * 100 / ZOOM_STEP) * ZOOM_STEP);
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fit)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasMode, device, customPage.enabled]);

  // Guards the debounced save's state updates below, not the save itself —
  // the pending `updateEvent` call still needs to fire and persist even if
  // the user navigates away inside the 700ms debounce window (dropping it
  // instead would silently discard a real edit); this just stops React from
  // touching state on a component that's no longer mounted by then.
  const isMountedRef = useRef(true);
  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // pointerWithin already prefers the smallest/most-nested droppable rect
  // under the pointer (it ranks candidates by intersection ratio, so a
  // container's own — always-larger — rect naturally loses to any child rect
  // the pointer is genuinely inside), falling back to rectIntersection only
  // when the pointer isn't within any droppable yet (e.g. right at a drag's
  // start).
  //
  // An earlier version added "stickiness" here — keep the previous winner
  // as long as it was still ranked near the top — to smooth boundary jitter
  // between a container and its child. That consistently backfired instead:
  // loosest version ("still present anywhere") broke nesting a sibling
  // container into another sibling, since an outer parent's rect contains
  // every descendant for the whole drag, so it never stopped being
  // "present". A tighter "top two" version still let a stale target keep
  // winning well after the pointer moved away from it — in the Outline
  // panel especially, where an expanded container's own sortable rect spans
  // the full height of everything nested inside it, so a row the pointer
  // passed over earlier in the drag could stay ranked #2 indefinitely (the
  // drop indicator kept showing a totally different, stale location —
  // hovering a deeply nested row showed the drop landing at the top level,
  // several rows away). Plain pointerWithin, unmodified, doesn't have that
  // failure mode: it always reflects the current pointer position.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
  }, []);

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

  // Copy/paste, Form.io-style: copy stores the block itself (nested children
  // included, since it's just this one BlockInstance and its own subtree);
  // paste always clones it fresh (see cloneBlockWithNewIds) and inserts the
  // clone directly after the block you pasted onto, in that same list —
  // "paste below" rather than requiring a separate target-picking step.
  // Independent of device toggle/canvas mode: it operates on `blocks`
  // directly, the same underlying data every mode (Edit/Outline/Preview)
  // renders, so copying while looking at one device view and pasting while
  // looking at another works the same as staying on one the whole time.
  const handleCopyBlock = (path: BlockPath) => {
    const block = getBlockList(blocks, path.containerId).find((b) => b.id === path.blockId);
    if (block) setClipboardBlock(block);
  };

  const handlePasteAfter = (path: BlockPath) => {
    if (!clipboardBlock) return;
    // Refuse a paste that would push the combined depth (how deep the
    // target list already sits, plus however many levels the copied
    // subtree itself adds) past the schema's own cap — silently, matching
    // computeDropPlan's equivalent drag-and-drop check, rather than letting
    // it through and only surfacing as a confusing Save failure later.
    const targetDepth = path.containerId === null ? 0 : (containerDepth(blocks, path.containerId) ?? 0) + 1;
    if (targetDepth + subtreeDepth(clipboardBlock) >= MAX_CONTAINER_DEPTH) return;
    const pasted = cloneBlockWithNewIds(clipboardBlock);
    const list = getBlockList(blocks, path.containerId);
    const index = list.findIndex((b) => b.id === path.blockId);
    if (index === -1) return;
    const nextList = [...list.slice(0, index + 1), pasted, ...list.slice(index + 1)];
    setBlocks(setBlockList(blocks, path.containerId, nextList));
  };

  // Ctrl/Cmd+C copies whatever's currently selected; Ctrl/Cmd+V pastes right
  // after it — the keyboard-shortcut half of "just like Form.io". Ignored
  // whenever focus is inside a real text input (name field, textarea, a
  // block's own text content, etc.) so it doesn't hijack normal copy/paste
  // of actual text — this only fires for the page's own block selection.
  // Also backs off for Ctrl/Cmd+C specifically whenever the user has an
  // actual text selection on the page: without this, selecting read-only
  // text inside a block's edit modal (a preview snippet, a URL, an error
  // message — anything outside an input/textarea) and pressing Ctrl/Cmd+C to
  // copy that text to the OS clipboard instead silently copied the whole
  // block and discarded the selection, since a text selection isn't a
  // "text entry target" the way a focused input is.
  useEffect(() => {
    function isTextEntryTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !selectedPath || isTextEntryTarget(e.target)) return;
      if (e.key === "c" || e.key === "C") {
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        handleCopyBlock(selectedPath);
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handlePasteAfter(selectedPath);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, blocks, clipboardBlock]);

  // Renaming from the Outline panel — same shape as handleChangeSelected
  // (which the block's own edit-modal header uses for the same field) but
  // addressable by path, not just "whatever's currently selected."
  const handleRenameBlock = (path: BlockPath, name: string) => {
    const list = getBlockList(blocks, path.containerId);
    const nextList = list.map((b) => (b.id === path.blockId ? ({ ...b, name: name || undefined } as BlockInstance) : b));
    setBlocks(setBlockList(blocks, path.containerId, nextList));
  };

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

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
    setDropPlan(null);
  };

  // Recomputes the live drop preview on every pointer move during a drag —
  // this is what drives the insertion-line indicator in editable-canvas.tsx.
  // Uses the exact same resolution function handleDragEnd commits with, so
  // the indicator the user sees is never a lie about what dropping will do.
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) {
      setDropPlan(null);
      return;
    }
    setDropPlan(computeDropPlan(blocks, String(active.id), String(over.id)));
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setActiveDragId(null);
    setDropPlan(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    setDropPlan(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const plan = computeDropPlan(blocks, activeId, overId);
    if (!plan) return;

    if (activeId.startsWith(PALETTE_DRAG_PREFIX)) {
      const type = activeId.slice(PALETTE_DRAG_PREFIX.length) as BlockType;
      const newBlock = makeBlockInstance(type);
      const list = getBlockList(blocks, plan.containerId);
      const index = Math.min(plan.index, list.length);
      const nextList = [...list.slice(0, index), newBlock, ...list.slice(index)];
      setBlocks(setBlockList(blocks, plan.containerId, nextList));
      return;
    }

    // Moving an existing block — within the same list (reorder), or across
    // lists entirely (drag out of/into a container, or between containers).
    // The "Position" control in a block's modal remains as a non-drag
    // alternative for when a precise drag target is fiddly to hit.
    const activeList = listContaining(activeId, blocks);
    if (!activeList) return;
    const sourceList = getBlockList(blocks, activeList.containerId);
    const movingBlock = sourceList.find((b) => b.id === activeId);
    if (!movingBlock) return;

    if (activeList.containerId === plan.containerId) {
      // Reorder within the same list `plan.index` was computed against
      // (which still contains movingBlock at its old position, so
      // plan.index is the hovered target's own pre-move array index).
      // arrayMove's `to` argument is the item's desired index in the
      // *already-shifted* (post-removal) array, not a raw pre-move index —
      // when dragging *forward* (oldIndex < plan.index), the target itself
      // shifts back by one once the moving item is spliced out ahead of it,
      // so passing plan.index unadjusted to arrayMove always lands the
      // moved item one slot too far — immediately *after* the hovered
      // target instead of before it. Dragging *backward* isn't affected
      // (removal happens after the target's index, so it never shifts) —
      // which is exactly the reported asymmetry: reordering upward landed
      // correctly, but forward reorders could only ever drop "below," never
      // "on top of," whatever was hovered.
      const oldIndex = sourceList.findIndex((b) => b.id === activeId);
      let newIndex = plan.index;
      if (oldIndex < newIndex) newIndex -= 1;
      newIndex = Math.min(Math.max(newIndex, 0), sourceList.length - 1);
      if (oldIndex === newIndex) return;
      setBlocks(setBlockList(blocks, activeList.containerId, arrayMove(sourceList, oldIndex, newIndex)));
      return;
    }

    // Cross-list move to a specific position: remove from the old list,
    // insert at the resolved index in the new one.
    const withoutBlock = setBlockList(blocks, activeList.containerId, sourceList.filter((b) => b.id !== activeId));
    const destList = getBlockList(withoutBlock, plan.containerId);
    const index = Math.min(plan.index, destList.length);
    const nextDestList = [...destList.slice(0, index), movingBlock, ...destList.slice(index)];
    setBlocks(setBlockList(withoutBlock, plan.containerId, nextDestList));
  };

  const activeDrag =
    activeDragId && activeDragId.startsWith(PALETTE_DRAG_PREFIX)
      ? { type: activeDragId.slice(PALETTE_DRAG_PREFIX.length) as BlockType, label: BLOCK_REGISTRY[activeDragId.slice(PALETTE_DRAG_PREFIX.length) as BlockType]?.label ?? "" }
      : activeDragId
        ? blockTypeAndLabelForId(blocks, activeDragId)
        : null;

  const modalOpen = Boolean(selectedBlock) || pageSettingsOpen;
  const modalTitle = selectedBlock ? selectedBlock.name || BLOCK_REGISTRY[selectedBlock.type]?.label || selectedBlock.type : "Page settings";

  const canvasThemeStyle = {
    "--t-bg": themeColors.background,
    "--t-fg": themeColors.foreground,
    "--t-accent": themeColors.accent,
    "--t-accent-dark": themeColors.accentDark,
    "--t-surface": themeColors.surface,
    "--t-font-display": themeFonts.displayVar,
    "--t-font-body": themeFonts.bodyVar,
    fontFamily: "var(--t-font-body)",
  } as CSSProperties;

  // Keyed by name (how <custom-component name="..."> looks them up) — built
  // once here, not re-derived per tag substitution.
  const customComponentsMap: CustomComponentMap = Object.fromEntries(
    customComponents.map((c) => [c.name, { html: c.html, css: c.css, js: c.js }])
  );

  const canvasCtx = {
    event: liveEvent,
    inviteId: "preview",
    guestName: "Guest Name",
    schema: formSchema,
    initialResponses: null,
    customComponents: customComponentsMap,
  };

  // Everything that swaps in the same theme-backed content well —
  // CustomPageFrame when the whole-page escape hatch is on (mode toggle is
  // moot then, blocks aren't in play), otherwise whichever of the three
  // canvas modes is active. All three modes share the same DndContext/
  // palette shell below so a palette drag always has somewhere valid to
  // land, even though only Edit/Outline actually use it.
  const paneContent = customPage.enabled ? (
    <CustomPageFrame
      {...customPage}
      shortcodes={{
        eventId: liveEvent.id,
        inviteId: "preview",
        venueName: liveEvent.venue_name,
        venueAddress: liveEvent.venue_address,
        schema: formSchema,
        customComponents: customComponentsMap,
      }}
    />
  ) : canvasMode === "outline" ? (
    <OutlinePanel
      blocks={blocks}
      selectedPath={selectedPath}
      onSelect={openBlock}
      onRemove={handleRemoveBlock}
      onMoveOut={handleMoveOut}
      onMoveTo={moveBlock}
      onRename={handleRenameBlock}
      containerOptions={containerOptions}
      dropPlan={dropPlan}
      onCopy={handleCopyBlock}
      onPaste={handlePasteAfter}
      hasClipboard={clipboardBlock !== null}
    />
  ) : canvasMode === "preview" ? (
    // Renders through the exact component the guest sees (PageRenderer, the
    // same one /e/[slug]/page.tsx uses) with zero editor chrome — the
    // definitive answer to "does my 0-padding layout actually look right,"
    // since there's no second implementation to drift from the real page.
    //
    // Rendered inside a real iframe (PreviewFrame), not just a max-width-
    // capped div: per-device (mobile/tablet) layout overrides are real
    // `@media` CSS (blockResponsiveCss), which only ever evaluates against
    // an actual viewport width — a div still sitting inside the dashboard's
    // own (usually much wider) window never triggered those rules
    // correctly. An iframe is a genuinely separate viewport sized to
    // PREVIEW_FRAME_WIDTH[device], so they do. Theme CSS vars are set on
    // the wrapper *inside* the portal (mirroring /e/[slug]/page.tsx's own
    // root div) since the iframe is a separate document — inheriting them
    // from an ancestor outside it isn't possible.
    <PreviewFrame width={PREVIEW_FRAME_WIDTH[device]}>
      <div className={cn("min-h-dvh bg-[var(--t-bg)]", themeFonts.bodyClassName, themeFonts.displayClassName)} style={canvasThemeStyle}>
        <PageRenderer schema={{ version: 1, blocks, pageStyle, themeOverrides, fontFamily, customPage }} ctx={canvasCtx} />
      </div>
    </PreviewFrame>
  ) : (
    <div style={{ fontFamily: fontFamily || undefined }}>
      <EditableCanvas
        blocks={blocks}
        ctx={canvasCtx}
        selectedPath={selectedPath}
        onSelect={openBlock}
        onRemove={handleRemoveBlock}
        onMoveOut={handleMoveOut}
        containerOptions={containerOptions}
        onMoveTo={moveBlock}
        device={device}
        dropPlan={dropPlan}
        onCopy={handleCopyBlock}
        onPaste={handlePasteAfter}
        hasClipboard={clipboardBlock !== null}
      />
    </div>
  );

  const canvas = (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Individually-scrollable columns so selecting a block near the
          bottom of a long page never hides the palette above or requires
          scrolling a separate settings panel into view — editing now opens
          in a modal (below) instead of a persistent third column. */}
      <div className="grid min-h-0 flex-1 grid-rows-[1fr] grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        <div className="flex min-h-0 flex-col rounded-lg border border-border bg-surface">
          <p className="shrink-0 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Components</p>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ComponentPalette
              onAdd={(type) => setBlocks((prev) => [...prev, makeBlockInstance(type)])}
              onAddLayout={(id) => setBlocks((prev) => [...prev, makeStarterLayout(id)])}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4 py-2">
            {!customPage.enabled && (
              <ToggleGroup options={CANVAS_MODE_OPTIONS} value={canvasMode} onChange={(v) => setCanvasMode(v as CanvasMode)} />
            )}
            <div className="flex items-center gap-2">
              <ToggleGroup options={DEVICE_OPTIONS} value={device} onChange={(v) => setDevice(v as DeviceWidth)} />
              <ZoomControl zoom={zoom} onChange={setZoom} />
            </div>
          </div>
          {canvasMode === "outline" && !customPage.enabled ? (
            <div className="min-h-0 flex-1 overflow-auto bg-background">{paneContent}</div>
          ) : (
            <div
              ref={previewPaneRef}
              className={cn(
                "min-h-0 flex-1 overflow-auto bg-[var(--t-bg)] px-6 py-4",
                themeFonts.bodyClassName,
                themeFonts.displayClassName
              )}
              style={canvasThemeStyle}
            >
              {canvasMode === "preview" ? (
                // PreviewFrame is a fixed-size iframe (real px, doesn't
                // reflow), so it needs a different wrapping than Edit mode's
                // reflowable content below: `justify-center` here centers
                // based on the scale wrapper's own box, which — with no
                // width of its own — shrinks to exactly the iframe's true
                // width. Centering the scale wrapper FIRST and transforming
                // it SECOND (rather than the other way — see the else
                // branch) is what keeps transform-origin's "center"
                // anchored to the iframe's actual center: getting this
                // backwards (scaling an ambiguously-sized box, then
                // centering) let the iframe overflow that box to one side,
                // so scaling shrank it around the wrong point and the whole
                // preview visibly leaned right with a dead gap on the left.
                <div className="flex justify-center">
                  <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>{paneContent}</div>
                </div>
              ) : (
                // Device width caps how wide Edit mode's real, reflowable
                // content is allowed to reflow (a real breakpoint test);
                // zoom is a pure visual scale of whatever that reflowed
                // layout looks like — the two combine without fighting
                // because zoom wraps the device-width box rather than the
                // other way around.
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  <div style={{ maxWidth: DEVICE_WIDTH_PX[device] ? `${DEVICE_WIDTH_PX[device]}px` : undefined, margin: "0 auto" }}>
                    {paneContent}
                  </div>
                </div>
              )}
            </div>
          )}
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
            ctx={canvasCtx}
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
