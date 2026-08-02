import { FieldValidator } from "./base";
import type { CheckboxFieldConfig } from "../types";

// A single boolean checkbox ("I agree to the terms") — value is the
// literal string "true" when checked, "" (or absent) when not, so it
// round-trips through the same string-valued Responses shape as every
// other scalar field instead of needing a separate boolean value type.
// isEmpty treating "unchecked" as "empty" is exactly what makes
// `required: true` mean "must be checked."
export class CheckboxValidator extends FieldValidator<CheckboxFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value !== "true";
  }

  protected validateValue(): string | null {
    return null;
  }
}
