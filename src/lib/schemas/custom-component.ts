import { z } from "zod";

// Validates a reusable component snippet before it's upserted into the
// custom_components table (see lib/data/custom-components.ts) — happens as
// a side effect of the normal page-schema save (dashboard/events/[eventId]/
// actions.ts's updatePageSchema), never trusting the client-typed shape
// as-cast, same reasoning as every other JSONB write path in this app.

// Matches customPage's html/css/js cap in lib/schemas/page-schema.ts — same
// sandboxed-iframe destination, same reasoning for the limit.
const MAX_CODE_LENGTH = 200_000;

export const customComponentInputSchema = z.object({
  // Used as the lookup key in <custom-component name="..." /> tags — kept
  // to a plain, predictable character set so it round-trips safely through
  // an HTML attribute with no escaping edge cases.
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, hyphens, and underscores."),
  html: z.string().max(MAX_CODE_LENGTH),
  css: z.string().max(MAX_CODE_LENGTH),
  js: z.string().max(MAX_CODE_LENGTH),
});

export type CustomComponentInput = z.infer<typeof customComponentInputSchema>;

export function parseCustomComponentInput(raw: unknown): { ok: true; value: CustomComponentInput } | { ok: false; error: string } {
  const result = customComponentInputSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid component." };
  }
  return { ok: true, value: result.data };
}
