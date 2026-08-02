import type { BlockInstance } from "./types";
import { containerDefaultConfig } from "./blocks/container";

// A page always starts truly blank (defaultPageSchema/an empty canvas) —
// these are just a faster on-ramp than manually adding a Container,
// switching it to grid mode, setting a column count, then adding that many
// nested Containers by hand. Every one of these is still a completely
// ordinary Container tree afterward — nothing about it is special or
// locked, a host can freely edit/delete/rearrange every piece.
export type StarterLayoutId = "single-section" | "two-column" | "three-column";

export const STARTER_LAYOUTS: { id: StarterLayoutId; label: string; description: string; columns: number }[] = [
  {
    id: "single-section",
    label: "Single section",
    description: "One full-width section to start filling in.",
    columns: 1,
  },
  {
    id: "two-column",
    label: "2 columns",
    description: "Two side-by-side sections — photo + text, for example.",
    columns: 2,
  },
  {
    id: "three-column",
    label: "3 columns",
    description: "Three side-by-side sections.",
    columns: 3,
  },
];

function emptyContainer(): BlockInstance {
  return {
    id: crypto.randomUUID(),
    type: "container",
    config: { ...containerDefaultConfig },
    children: [],
  } as BlockInstance;
}

export function makeStarterLayout(id: StarterLayoutId): BlockInstance {
  const layout = STARTER_LAYOUTS.find((l) => l.id === id);
  const columns = layout?.columns ?? 1;
  return {
    id: crypto.randomUUID(),
    type: "container",
    config: {
      ...containerDefaultConfig,
      layoutMode: columns > 1 ? "grid" : "column",
      gridColumns: columns,
    },
    children: Array.from({ length: columns }, () => emptyContainer()),
  } as BlockInstance;
}
