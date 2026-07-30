import type { FormField, FormSchema, Responses } from "./form-schema";
import { MAX_NAME_LENGTH, MAX_GUESTS } from "./rsvp-limits";

function sanitizeScalar(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function sanitizeList(value: unknown, maxItems: number, maxLength: number) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((v) => sanitizeScalar(v, maxLength))
    .filter((v) => v.length > 0)
    .slice(0, maxItems);
}

// A checkbox group can't legitimately have more distinct selections than
// options exist — dedupe (a repeated-value payload would otherwise pass
// validateResponses's option-membership check while still inflating the
// stored array size) and cap to the option count.
function sanitizeCheckboxValues(value: unknown, options: string[] | undefined) {
  const list = Array.isArray(value) ? value.map(String) : [];
  const cap = options?.length ?? MAX_GUESTS;
  return Array.from(new Set(list)).slice(0, cap);
}

// Extracts + sanitizes one field's raw FormData entries into a Responses
// value, without validating required-ness or option membership yet (see
// validateResponses below, which runs on the result of this).
function readFieldFromFormData(field: FormField, formData: FormData): string | string[] {
  const maxLength = field.maxLength ?? MAX_NAME_LENGTH;

  switch (field.type) {
    case "plus_ones":
      return sanitizeList(formData.getAll(field.id), field.maxItems ?? MAX_GUESTS, maxLength);
    case "checkbox":
      return sanitizeCheckboxValues(formData.getAll(field.id), field.options);
    case "text":
    case "textarea":
    case "select":
    case "radio":
    default:
      return sanitizeScalar(formData.get(field.id), maxLength);
  }
}

export function buildResponsesFromFormData(schema: FormSchema, formData: FormData): Responses {
  const responses: Responses = {};
  for (const field of schema.fields) {
    responses[field.id] = readFieldFromFormData(field, formData);
  }
  return responses;
}

// Sanitizes an already-structured Responses object (e.g. from the host-side
// edit dialog, which builds a Responses value directly in the browser
// rather than via a <form> submission) the same way readFieldFromFormData
// does for guest submissions, so both paths enforce the same limits.
export function sanitizeResponses(schema: FormSchema, raw: Responses): Responses {
  const responses: Responses = {};
  for (const field of schema.fields) {
    const value = raw[field.id];
    const maxLength = field.maxLength ?? MAX_NAME_LENGTH;
    if (field.type === "checkbox") {
      responses[field.id] = sanitizeCheckboxValues(value, field.options);
    } else if (field.type === "plus_ones") {
      responses[field.id] = sanitizeList(value, field.maxItems ?? MAX_GUESTS, maxLength);
    } else {
      responses[field.id] = sanitizeScalar(value, maxLength);
    }
  }
  return responses;
}

// Throws a user-facing message on the first invalid field — required
// fields, and select/radio/checkbox values that aren't one of the field's
// configured options.
export function validateResponses(schema: FormSchema, responses: Responses) {
  for (const field of schema.fields) {
    const value = responses[field.id];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

    if (field.required && isEmpty && field.type !== "plus_ones") {
      throw new Error(`${field.label} is required.`);
    }

    if (
      (field.type === "select" || field.type === "radio") &&
      typeof value === "string" &&
      value &&
      field.options &&
      !field.options.includes(value)
    ) {
      throw new Error(`${field.label} has an invalid value.`);
    }

    if (
      field.type === "checkbox" &&
      Array.isArray(value) &&
      field.options &&
      value.some((v) => !field.options!.includes(v))
    ) {
      throw new Error(`${field.label} has an invalid value.`);
    }
  }
}
