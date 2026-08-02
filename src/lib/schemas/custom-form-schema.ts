import { z } from "zod";
import type { CustomFormSchema } from "@/lib/forms/types";
import { EMPTY_CUSTOM_FORM_SCHEMA } from "@/lib/forms/types";

// Structural validation for the `forms.schema` jsonb column. Unlike
// page-schema.ts's deliberately-loose block `config` (many block types
// share one field for different presentational purposes, so being strict
// there risks rejecting valid rows over drift), every field here is fully
// validated per-kind up front: a custom form's schema directly gates what
// gets trusted from anonymous guest submissions later
// (src/lib/forms/validate-submission.ts), so looseness here would be a
// validation gap, not a convenience.

const baseFieldShape = {
  id: z.string().min(1),
  label: z.string().max(200),
  required: z.boolean(),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
};

const options = z.array(z.string().max(200)).max(50);

const customFormFieldSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), ...baseFieldShape, maxLength: z.number().finite().positive().optional() }),
  z.object({ kind: z.literal("textarea"), ...baseFieldShape, maxLength: z.number().finite().positive().optional() }),
  z.object({ kind: z.literal("email"), ...baseFieldShape }),
  z.object({ kind: z.literal("phone"), ...baseFieldShape }),
  z.object({
    kind: z.literal("number"),
    ...baseFieldShape,
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    integer: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("date"),
    ...baseFieldShape,
    minDate: z.string().max(10).optional(),
    maxDate: z.string().max(10).optional(),
  }),
  z.object({ kind: z.literal("select"), ...baseFieldShape, options }),
  z.object({ kind: z.literal("radio"), ...baseFieldShape, options }),
  z.object({ kind: z.literal("checkbox"), ...baseFieldShape }),
  z.object({ kind: z.literal("checkbox_group"), ...baseFieldShape, options, maxSelected: z.number().finite().positive().optional() }),
  z.object({ kind: z.literal("address"), ...baseFieldShape, requireLine2: z.boolean().optional() }),
]);

const customFormSchemaSchema = z.object({ fields: z.array(customFormFieldSchema).max(60) });

// Never an `as`-cast: a malformed/hand-edited row falls back to an empty
// form (a form with zero fields is a legitimate, if unusual, shape — same
// "empty is honored, only structurally-broken is corrupt" rule
// resolveFormSchema uses for the RSVP engine) rather than throwing and
// taking down the page-builder or the public page.
export function parseCustomFormSchema(raw: unknown): CustomFormSchema {
  const result = customFormSchemaSchema.safeParse(raw);
  return result.success ? (result.data as CustomFormSchema) : EMPTY_CUSTOM_FORM_SCHEMA;
}
