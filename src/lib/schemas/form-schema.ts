import { MAX_NAME_LENGTH, MAX_GUESTS } from "../rsvp-limits";

export type FieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "plus_ones";

// Lets the app find "the field that means attending" (or name, or
// plus-ones) even after a host relabels it — independent of id/label/type.
// Only one field per event should carry a given non-null role; enforced by
// whichever action saves the schema, not by this module.
export type FieldRole = "name" | "attending" | "plus_ones" | null;

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  role: FieldRole;
  required: boolean;
  options?: string[];
  maxLength?: number;
  maxItems?: number;
  placeholder?: string;
};

export type FormSchema = { fields: FormField[] };

export type Responses = Record<string, string | string[]>;

export const DEFAULT_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      role: "name",
      required: true,
      maxLength: MAX_NAME_LENGTH,
      placeholder: "Full name",
    },
    {
      id: "attending",
      type: "radio",
      label: "Attending?",
      role: "attending",
      required: true,
      options: ["yes", "no"],
    },
    {
      id: "plus_ones",
      type: "plus_ones",
      label: "Plus ones",
      role: "plus_ones",
      required: false,
      maxItems: MAX_GUESTS,
      maxLength: MAX_NAME_LENGTH,
    },
  ],
};

// Role-tagged built-in fields keep their original type/options locked while
// they exist, so `role: "attending"` always means a trustworthy yes/no
// choice — label/required/position stay freely editable, and the field can
// always be deleted outright if a host wants to change how attendance
// works. Custom (role: null) fields have no such lock. The client (see
// form-builder-panel.tsx) disables editing these for a role-tagged field,
// but that's just UX — enforceRoleLock is what actually makes it safe to
// trust `role` server-side (e.g. in deriveLegacyScalars), by overriding
// whatever type/options a request claims back to the canonical shape for
// that role, regardless of what the client sent.
const ROLE_CANONICAL_SHAPE: Record<Exclude<FieldRole, null>, Pick<FormField, "type" | "options">> = {
  name: { type: "text", options: undefined },
  attending: { type: "radio", options: ["yes", "no"] },
  plus_ones: { type: "plus_ones", options: undefined },
};

export function enforceRoleLock(field: FormField): FormField {
  if (!field.role) return field;
  return { ...field, ...ROLE_CANONICAL_SHAPE[field.role] };
}

function isFieldType(value: unknown): value is FieldType {
  return (
    typeof value === "string" &&
    ["text", "textarea", "select", "radio", "checkbox", "plus_ones"].includes(value)
  );
}

function isFieldRole(value: unknown): value is FieldRole {
  return value === null || value === "name" || value === "attending" || value === "plus_ones";
}

function sanitizeField(raw: unknown): FormField | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  if (!isFieldType(r.type)) return null;
  if (typeof r.label !== "string") return null;

  return {
    id: r.id,
    type: r.type,
    label: r.label,
    role: isFieldRole(r.role) ? r.role : null,
    required: Boolean(r.required),
    options: Array.isArray(r.options) ? r.options.map(String) : undefined,
    maxLength: typeof r.maxLength === "number" ? r.maxLength : undefined,
    maxItems: typeof r.maxItems === "number" ? r.maxItems : undefined,
    placeholder: typeof r.placeholder === "string" ? r.placeholder : undefined,
  };
}

// null/invalid input (an event that never customized its form, or malformed
// jsonb) falls back to the default 3-field form — existing events keep
// working unchanged. A deliberately-emptied form (`{ fields: [] }`, saved by
// a host who removed every field) is honored as-is rather than treated as
// "invalid" — a fields-less RSVP ("just confirm you saw this, no questions
// asked") is a legitimate form shape, not a corrupt one. Only a non-empty
// `fields` array where every entry fails sanitization counts as corrupt
// (malformed jsonb), and still falls back to the default.
export function resolveFormSchema(raw: unknown): FormSchema {
  if (raw && typeof raw === "object" && Array.isArray((raw as { fields?: unknown }).fields)) {
    const rawFields = (raw as { fields: unknown[] }).fields;
    if (rawFields.length === 0) {
      return { fields: [] };
    }
    const fields = rawFields.map(sanitizeField).filter((f): f is FormField => f !== null);
    if (fields.length > 0) {
      return { fields };
    }
  }
  return DEFAULT_FORM_SCHEMA;
}

export function findFieldByRole(
  schema: FormSchema,
  role: Exclude<FieldRole, null>
): FormField | null {
  return schema.fields.find((f) => f.role === role) ?? null;
}

type LegacyRsvpRow = {
  name: string;
  attending: boolean;
  additional_guests: string[];
  responses?: Responses | null;
};

// Reads a field's value for a given RSVP row: prefer the schema-driven
// `responses` blob, falling back to the legacy scalar columns by role for
// rows written before the field existed (or before this schema edit).
// Derives the 3 legacy scalar columns from a schema-driven Responses value,
// so every write keeps them as a reliable fast-path/historical fallback —
// not just during a migration window (see getFieldValue's role fallback).
//
// `fallbackName` covers events with no name-role field: callers pass the one
// name they already know is trustworthy for that guest (the invite's own
// name for a public submission, or the RSVP row's current name when a host
// edits a response with no name field to read from) so the guest list never
// regresses to the generic "Guest" placeholder while a real name is known.
export function deriveLegacyScalars(schema: FormSchema, responses: Responses, fallbackName?: string) {
  const nameField = findFieldByRole(schema, "name");
  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");

  const nameValue = nameField ? responses[nameField.id] : undefined;
  const attendingValue = attendingField ? responses[attendingField.id] : undefined;
  const plusOnesValue = plusOnesField ? responses[plusOnesField.id] : undefined;

  return {
    name: (typeof nameValue === "string" && nameValue) || fallbackName || "Guest",
    attending: attendingValue === "yes",
    additional_guests: Array.isArray(plusOnesValue) ? plusOnesValue : [],
  };
}

export function getFieldValue(rsvp: LegacyRsvpRow, field: FormField): string | string[] | undefined {
  const fromResponses = rsvp.responses?.[field.id];
  if (fromResponses !== undefined) return fromResponses;

  switch (field.role) {
    case "name":
      return rsvp.name;
    case "attending":
      return rsvp.attending ? "yes" : "no";
    case "plus_ones":
      return rsvp.additional_guests ?? [];
    default:
      return undefined;
  }
}
