import { z } from "zod";
import type { BlockInstance, BlockType, PageSchema } from "@/lib/blocks/types";

// Real structural validation for the page_schema jsonb column (docs/02 W1) —
// previously `resolvePageSchema` only checked "has a non-empty blocks
// array" and cast the rest with `as PageSchema`, so a hand-edited or
// corrupted row could crash the public guest page. This validates every
// block's shape and — critically — filters out individual invalid blocks
// rather than failing the whole page, since one bad block shouldn't take
// down an otherwise-good page for a guest.

const BLOCK_TYPES: BlockType[] = [
  "hero",
  "text",
  "image",
  "carousel",
  "spacer",
  "countdown",
  "rsvp-form",
  "venue-map",
  "custom-html",
  "container",
];

const blockLayoutSchema = z
  .object({
    align: z.enum(["left", "center", "right"]),
    width: z.enum(["small", "medium", "large", "full"]),
    minHeightPx: z.number().finite().optional(),
    textColorOverride: z.string().max(64).optional(),
    customCss: z.string().max(4000).optional(),
    flexGrow: z.number().finite().optional(),
    gridSpan: z.number().finite().optional(),
  })
  .partial({ align: true, width: true })
  .passthrough();

// Config shapes stay intentionally loose (a record, not a per-key schema):
// every block's own Edit/Render component already defensively reads its
// config with fallbacks, and being too strict here would risk rejecting
// otherwise-valid rows over a schema drift in one block type. What matters
// for crash-safety is the block's own `type`/`id`/`children` shape below.
const blockConfigSchema = z.record(z.string(), z.unknown());

const MAX_CONTAINER_DEPTH = 8;

function blockInstanceSchema(depth: number): z.ZodType<BlockInstance> {
  const base = z.object({
    id: z.string().min(1),
    name: z.string().max(80).optional(),
    type: z.enum(BLOCK_TYPES as [BlockType, ...BlockType[]]),
    config: blockConfigSchema,
    layout: blockLayoutSchema.optional(),
    children: depth < MAX_CONTAINER_DEPTH ? z.array(z.lazy(() => blockInstanceSchema(depth + 1))).optional() : z.undefined(),
  });
  return base as unknown as z.ZodType<BlockInstance>;
}

const pageSchemaShape = z.object({
  version: z.literal(1),
  blocks: z.array(blockInstanceSchema(0)),
  pageStyle: z.string().max(4000).optional(),
  themeOverrides: z.record(z.string(), z.string()).optional(),
  fontFamily: z.string().max(200).optional(),
  customPage: z
    .object({
      enabled: z.boolean(),
      html: z.string().max(200_000),
      css: z.string().max(200_000),
      js: z.string().max(200_000),
    })
    .optional(),
});

// Validates one block; returns null (and logs) rather than throwing, so the
// caller can drop just this block and keep the rest of the page intact.
function safeParseBlock(raw: unknown): BlockInstance | null {
  const result = blockInstanceSchema(0).safeParse(raw);
  if (!result.success) {
    console.warn("Dropping invalid page block:", result.error.message);
    return null;
  }
  return result.data;
}

// null/malformed input (an event that never opened the builder, or a
// corrupted row) returns null — the caller falls back to the seeded default
// layout, same behavior as before this validator existed.
export function parsePageSchema(raw: unknown): PageSchema | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as { version?: unknown; blocks?: unknown };
  if (candidate.version !== 1 && candidate.version !== undefined) return null;
  if (!Array.isArray(candidate.blocks)) return null;

  const blocks = candidate.blocks.map(safeParseBlock).filter((b): b is BlockInstance => b !== null);
  if (blocks.length === 0) return null;

  const rest = pageSchemaShape.omit({ blocks: true, version: true }).partial().safeParse(raw);

  return {
    version: 1,
    blocks,
    ...(rest.success ? rest.data : {}),
  };
}
