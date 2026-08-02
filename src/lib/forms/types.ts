// Generic multi-form field-type vocabulary — deliberately separate from
// src/lib/schemas/form-schema.ts (the RSVP form's own, narrower engine).
// See docs/01-product-definition.md's dated entry on why these stay two
// engines instead of one.

export type FieldKind =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "checkbox_group"
  | "address";

// Every concrete field value shape a kind can produce. A compound field
// (address) is the one case that isn't a plain string/string[] — kept as
// its own object rather than flattened into several top-level responses
// keys, so "one host-added field" always maps to "one responses key."
export type AddressValue = { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
export type FieldValue = string | string[] | AddressValue;
export type FormResponses = Record<string, FieldValue>;

// Shared by every field kind — label/required/placeholder/help-text is the
// same concept regardless of kind, so it's lifted out once instead of
// repeated in each per-kind config type.
export type BaseFieldConfig = {
  id: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
};

export type TextFieldConfig = BaseFieldConfig & { maxLength?: number };
export type TextareaFieldConfig = BaseFieldConfig & { maxLength?: number };
export type EmailFieldConfig = BaseFieldConfig;
export type PhoneFieldConfig = BaseFieldConfig;
export type NumberFieldConfig = BaseFieldConfig & { min?: number; max?: number; integer?: boolean };
export type DateFieldConfig = BaseFieldConfig & { minDate?: string; maxDate?: string };
export type SelectFieldConfig = BaseFieldConfig & { options: string[] };
export type RadioFieldConfig = BaseFieldConfig & { options: string[] };
export type CheckboxFieldConfig = BaseFieldConfig;
export type CheckboxGroupFieldConfig = BaseFieldConfig & { options: string[]; maxSelected?: number };
export type AddressFieldConfig = BaseFieldConfig & { requireLine2?: boolean };

// Discriminated union on `kind` — mirrors how src/lib/blocks/types.ts's
// `BlockInstance` discriminates on `type`. Each variant's config is
// flattened alongside `kind` (not nested under a `config` key) to match
// the existing RSVP `FormField` shape (`{ id, type, label, ... }`) that
// hosts/devs in this codebase already read JSONB rows in the shape of.
export type CustomFormField =
  | ({ kind: "text" } & TextFieldConfig)
  | ({ kind: "textarea" } & TextareaFieldConfig)
  | ({ kind: "email" } & EmailFieldConfig)
  | ({ kind: "phone" } & PhoneFieldConfig)
  | ({ kind: "number" } & NumberFieldConfig)
  | ({ kind: "date" } & DateFieldConfig)
  | ({ kind: "select" } & SelectFieldConfig)
  | ({ kind: "radio" } & RadioFieldConfig)
  | ({ kind: "checkbox" } & CheckboxFieldConfig)
  | ({ kind: "checkbox_group" } & CheckboxGroupFieldConfig)
  | ({ kind: "address" } & AddressFieldConfig);

export type CustomFormSchema = { fields: CustomFormField[] };

export const EMPTY_CUSTOM_FORM_SCHEMA: CustomFormSchema = { fields: [] };
