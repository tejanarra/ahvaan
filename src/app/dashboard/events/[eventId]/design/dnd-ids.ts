// Tiny shared constants so the id scheme for "an empty list's drop
// placeholder" stays identical between the canvas renderer
// (editable-canvas.tsx) and the drag-end resolution logic (page-builder.tsx)
// without those two files importing from each other.
export const EMPTY_LIST_PREFIX = "emptylist:";
export const emptyListId = (containerId: string | null) => `${EMPTY_LIST_PREFIX}${containerId ?? "root"}`;

// The symmetric counterpart to the end-of-list zone above: an explicit,
// always-present "drop here to land first" target for every non-empty list.
// Without it, the only way to insert before a container's/the page's first
// child was to precisely hover that child's own (often thin) row — hovering
// the *container's* own box always resolves to "append at the end" (see
// resolveInsertionPoint in page-builder.tsx), so there was no reliable way
// to land something at the very top of a container from container-level
// hovering alone.
export const START_LIST_PREFIX = "startlist:";
export const startListId = (containerId: string | null) => `${START_LIST_PREFIX}${containerId ?? "root"}`;

// A single, unambiguous description of "where a drag would land right now"
// — computed live during onDragOver (see page-builder.tsx's computeDropPlan)
// and reused for both the visual insertion-line indicator (editable-canvas.tsx)
// and the actual commit on drop. `index` is always a position within
// `containerId`'s children (or the top-level list, when null); landing
// "inside" a container (as opposed to before/after it as a sibling) is just
// index === that container's current child count — there's no separate
// "nest" vs "insert" case to keep in sync between preview and commit.
export type DropPlan = { containerId: string | null; index: number } | null;
