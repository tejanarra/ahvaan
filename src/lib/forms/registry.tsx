import type { ComponentType } from "react";
import type { FieldKind, FieldValue, BaseFieldConfig, CustomFormSchema } from "./types";
import type {
  TextFieldConfig,
  TextareaFieldConfig,
  EmailFieldConfig,
  PhoneFieldConfig,
  NumberFieldConfig,
  DateFieldConfig,
  SelectFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
  CheckboxGroupFieldConfig,
  AddressFieldConfig,
} from "./types";
import { FieldValidator } from "./validators/base";
import { TextValidator } from "./validators/text";
import { EmailValidator } from "./validators/email";
import { PhoneValidator } from "./validators/phone";
import { NumberValidator } from "./validators/number";
import { DateValidator } from "./validators/date";
import { SingleChoiceValidator } from "./validators/choice";
import { CheckboxValidator } from "./validators/checkbox";
import { CheckboxGroupValidator } from "./validators/checkbox-group";
import { AddressValidator } from "./validators/address";
import { TextFieldEdit, TextFieldInput } from "./fields/text";
import { TextareaFieldEdit, TextareaFieldInput } from "./fields/textarea";
import { EmailFieldEdit, EmailFieldInput } from "./fields/email";
import { PhoneFieldEdit, PhoneFieldInput } from "./fields/phone";
import { NumberFieldEdit, NumberFieldInput } from "./fields/number";
import { DateFieldEdit, DateFieldInput } from "./fields/date";
import { SelectFieldEdit, SelectFieldInput } from "./fields/select";
import { RadioFieldEdit, RadioFieldInput } from "./fields/radio";
import { CheckboxFieldEdit, CheckboxFieldInput } from "./fields/checkbox";
import { CheckboxGroupFieldEdit, CheckboxGroupFieldInput } from "./fields/checkbox-group";
import { AddressFieldEdit, AddressFieldInput } from "./fields/address";
import { TextLinesIcon, MailIcon, PhoneIcon, HashIcon, CalendarIcon, ChevronDownIcon, RadioIcon, CheckIcon, ClipboardListIcon, MapPinIcon } from "@/components/icons";

// The extension point for adding a new field kind: one config type in
// types.ts, one validator (extends FieldValidator — see validators/base.ts)
// implementing just its own rule, one Edit+Input pair (fields/*.tsx), and
// one entry here. Mirrors src/lib/blocks/registry.tsx's BLOCK_REGISTRY —
// same "one lookup table, every consumer keys off it" shape, applied to
// form fields instead of page blocks.
export type FieldTypeDefinition<TConfig extends BaseFieldConfig = BaseFieldConfig, TValue extends FieldValue = FieldValue> = {
  kind: FieldKind;
  label: string;
  icon: ComponentType<{ className?: string }>;
  defaultConfig: Omit<TConfig, "id">;
  validator: FieldValidator<TConfig, TValue>;
  Edit: ComponentType<{ config: TConfig; onChange: (next: TConfig) => void }>;
  Input: ComponentType<{ config: TConfig; value: TValue | undefined; onChange: (next: TValue) => void; error?: string | null }>;
};

const base = { label: "", required: false };

// `any, any` here is a deliberate type-erasure point, not laziness: each
// entry below has its own concrete TConfig/TValue (e.g. `TextFieldConfig`/
// `string`), and TypeScript's contravariant checking of the Edit/Input
// `onChange` callback types means no single shared bound (not even
// `FieldTypeDefinition<BaseFieldConfig, FieldValue>`) both type-checks
// every entry AND stays sound at the lookup call sites (fields-builder.tsx/
// custom-form.tsx's own registry-dispatch pattern — see their matching
// comments). This is the same escape hatch a heterogeneous component
// registry needs in any strictly-typed language; consumers only ever
// index by a specific `FieldKind`, never iterate generically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FIELD_TYPE_REGISTRY: Record<FieldKind, FieldTypeDefinition<any, any>> = {
  text: {
    kind: "text",
    label: "Short text",
    icon: TextLinesIcon,
    defaultConfig: { ...base, label: "Short answer" } satisfies Omit<TextFieldConfig, "id">,
    validator: new TextValidator(),
    Edit: TextFieldEdit,
    Input: TextFieldInput,
  },
  textarea: {
    kind: "textarea",
    label: "Long text",
    icon: TextLinesIcon,
    defaultConfig: { ...base, label: "Long answer" } satisfies Omit<TextareaFieldConfig, "id">,
    validator: new TextValidator(),
    Edit: TextareaFieldEdit,
    Input: TextareaFieldInput,
  },
  email: {
    kind: "email",
    label: "Email",
    icon: MailIcon,
    defaultConfig: { ...base, label: "Email address" } satisfies Omit<EmailFieldConfig, "id">,
    validator: new EmailValidator(),
    Edit: EmailFieldEdit,
    Input: EmailFieldInput,
  },
  phone: {
    kind: "phone",
    label: "Phone number",
    icon: PhoneIcon,
    defaultConfig: { ...base, label: "Phone number" } satisfies Omit<PhoneFieldConfig, "id">,
    validator: new PhoneValidator(),
    Edit: PhoneFieldEdit,
    Input: PhoneFieldInput,
  },
  number: {
    kind: "number",
    label: "Number",
    icon: HashIcon,
    defaultConfig: { ...base, label: "Number" } satisfies Omit<NumberFieldConfig, "id">,
    validator: new NumberValidator(),
    Edit: NumberFieldEdit,
    Input: NumberFieldInput,
  },
  date: {
    kind: "date",
    label: "Date",
    icon: CalendarIcon,
    defaultConfig: { ...base, label: "Date" } satisfies Omit<DateFieldConfig, "id">,
    validator: new DateValidator(),
    Edit: DateFieldEdit,
    Input: DateFieldInput,
  },
  select: {
    kind: "select",
    label: "Dropdown",
    icon: ChevronDownIcon,
    defaultConfig: { ...base, label: "Choose one", options: ["Option 1", "Option 2"] } satisfies Omit<SelectFieldConfig, "id">,
    validator: new SingleChoiceValidator(),
    Edit: SelectFieldEdit,
    Input: SelectFieldInput,
  },
  radio: {
    kind: "radio",
    label: "Multiple choice",
    icon: RadioIcon,
    defaultConfig: { ...base, label: "Choose one", options: ["Option 1", "Option 2"] } satisfies Omit<RadioFieldConfig, "id">,
    validator: new SingleChoiceValidator(),
    Edit: RadioFieldEdit,
    Input: RadioFieldInput,
  },
  checkbox: {
    kind: "checkbox",
    label: "Checkbox",
    icon: CheckIcon,
    defaultConfig: { ...base, label: "I agree" } satisfies Omit<CheckboxFieldConfig, "id">,
    validator: new CheckboxValidator(),
    Edit: CheckboxFieldEdit,
    Input: CheckboxFieldInput,
  },
  checkbox_group: {
    kind: "checkbox_group",
    label: "Checkboxes (multi-select)",
    icon: ClipboardListIcon,
    defaultConfig: { ...base, label: "Choose all that apply", options: ["Option 1", "Option 2"] } satisfies Omit<
      CheckboxGroupFieldConfig,
      "id"
    >,
    validator: new CheckboxGroupValidator(),
    Edit: CheckboxGroupFieldEdit,
    Input: CheckboxGroupFieldInput,
  },
  address: {
    kind: "address",
    label: "Address",
    icon: MapPinIcon,
    defaultConfig: { ...base, label: "Address" } satisfies Omit<AddressFieldConfig, "id">,
    validator: new AddressValidator(),
    Edit: AddressFieldEdit,
    Input: AddressFieldInput,
  },
};

export const FIELD_KINDS: FieldKind[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "checkbox_group",
  "address",
];

export function makeCustomFormField(kind: FieldKind) {
  const def = FIELD_TYPE_REGISTRY[kind];
  return { kind, id: crypto.randomUUID(), ...def.defaultConfig } as const;
}

// Switching an event's submission mode to 'email_verified' (Guests →
// Settings — one event-wide setting, applied to every form on the event)
// needs a trustworthy email value to dedup/key submissions by — this seeds
// one automatically (append, not replace, fixed id so it's idempotent) so
// it's a single host click rather than a second manual "now go add an
// Email field" step per form, mirroring ensureEmailField in
// src/lib/schemas/form-schema.ts for RSVP. A no-op if the schema already
// has an email-kind field, however it got there.
//
// Not marked `required: true` — same reasoning as ensureEmailField: a
// guest arriving via their personal invite link is already trusted and
// shouldn't be forced to type an email too; requiring (and verifying) it
// only applies to a guest with no invite link, enforced at submit time
// (form-submit.ts).
export function ensureCustomFormEmailField(schema: CustomFormSchema): CustomFormSchema {
  if (schema.fields.some((f) => f.kind === "email")) return schema;
  return {
    fields: [
      ...schema.fields,
      { kind: "email", id: "email", label: "Email", required: false, placeholder: "you@example.com" },
    ],
  };
}
