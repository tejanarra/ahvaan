import type { CustomFormSchema, FormResponses, AddressValue, CustomFormField } from "./types";
import { FIELD_TYPE_REGISTRY } from "./registry";

const DEFAULT_MAX_LENGTH = 500;
const MAX_ADDRESS_PART_LENGTH = 200;

function sanitizeScalar(value: FormDataEntryValue | null, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function readAddress(field: Extract<CustomFormField, { kind: "address" }>, formData: FormData): AddressValue {
  const get = (suffix: string) => sanitizeScalar(formData.get(`${field.id}.${suffix}`), MAX_ADDRESS_PART_LENGTH);
  return {
    line1: get("line1"),
    line2: get("line2"),
    city: get("city"),
    state: get("state"),
    postalCode: get("postalCode"),
    country: get("country"),
  };
}

// Extracts + sanitizes one FormData submission into a FormResponses value,
// per-kind — mirrors src/lib/schemas/responses.ts's
// buildResponsesFromFormData for the RSVP engine. Does not check
// required-ness or per-kind correctness (min/max, email shape, ...) yet —
// see validateCustomFormResponses below, which runs on this function's
// output.
export function buildCustomFormResponsesFromFormData(schema: CustomFormSchema, formData: FormData): FormResponses {
  const responses: FormResponses = {};
  for (const field of schema.fields) {
    switch (field.kind) {
      case "checkbox_group": {
        const raw = formData.getAll(field.id).map(String);
        const cap = field.maxSelected ?? field.options.length;
        responses[field.id] = Array.from(new Set(raw)).slice(0, cap);
        break;
      }
      case "checkbox":
        responses[field.id] = formData.get(field.id) ? "true" : "";
        break;
      case "address":
        responses[field.id] = readAddress(field, formData);
        break;
      case "text":
      case "textarea":
        responses[field.id] = sanitizeScalar(formData.get(field.id), field.maxLength ?? DEFAULT_MAX_LENGTH);
        break;
      default:
        responses[field.id] = sanitizeScalar(formData.get(field.id), DEFAULT_MAX_LENGTH);
    }
  }
  return responses;
}

// Runs every field's registry-provided validator (the OOP validator
// hierarchy — src/lib/forms/validators/) over an already-sanitized
// FormResponses value. Returns a per-field error map (empty = valid)
// rather than throwing on the first failure, so a submitting guest sees
// every problem at once instead of one at a time.
export function validateCustomFormResponses(schema: CustomFormSchema, responses: FormResponses): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema.fields) {
    const definition = FIELD_TYPE_REGISTRY[field.kind];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = definition.validator.validate(responses[field.id] as any, field as any);
    if (error) errors[field.id] = error;
  }
  return errors;
}

export function firstValidationError(errors: Record<string, string>): string | null {
  const first = Object.values(errors)[0];
  return first ?? null;
}
