import type { CustomFormSchema, FormResponses, AddressValue, CustomFormField } from "./types";
import { FIELD_TYPE_REGISTRY } from "./registry";

const DEFAULT_MAX_LENGTH = 500;
const MAX_ADDRESS_PART_LENGTH = 200;
// Sanitization ceiling for text/textarea, independent of the host's own
// (optional) "Max length" field setting — that setting is enforced by
// TextValidator as a real, reportable error, not by truncating here.
// Truncating to a host-configured maxLength (or the old DEFAULT_MAX_LENGTH
// fallback) at this stage would silently drop everything past the limit
// with no error shown to the guest, and would make TextValidator's own
// length check unreachable dead code. This is only a belt-and-suspenders
// anti-abuse ceiling — assertWithinSizeBudget (64 KB per submission) is the
// real backstop.
const UNBOUNDED_TEXT_MAX_LENGTH = 20_000;

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
        // Not capped to field.maxSelected here — an over-selection must
        // reach CheckboxGroupValidator so it's rejected with a real error,
        // not silently dropped down to the cap (a guest who checked 4 of 5
        // options on a maxSelected:2 field should see why their submission
        // failed, not get a success screen for a submission missing 2 of
        // their answers). Only capped defensively at the option count,
        // since more distinct selections than options exist can't be
        // legitimate no matter what maxSelected says.
        const raw = formData.getAll(field.id).map(String);
        responses[field.id] = Array.from(new Set(raw)).slice(0, field.options.length);
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
        // Not capped to field.maxLength here (even when the host set one)
        // — an over-length value must reach TextValidator so it's rejected
        // with a real error, not silently truncated with no indication
        // anything was lost. Only capped at the generous anti-abuse
        // ceiling (UNBOUNDED_TEXT_MAX_LENGTH); assertWithinSizeBudget is
        // the real backstop against a giant payload.
        responses[field.id] = sanitizeScalar(formData.get(field.id), UNBOUNDED_TEXT_MAX_LENGTH);
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
