// Tiny shared constants so the id scheme for "an empty list's drop
// placeholder" stays identical between the canvas renderer
// (editable-canvas.tsx) and the drag-end resolution logic (page-builder.tsx)
// without those two files importing from each other.
export const EMPTY_LIST_PREFIX = "emptylist:";
export const emptyListId = (containerId: string | null) => `${EMPTY_LIST_PREFIX}${containerId ?? "root"}`;
