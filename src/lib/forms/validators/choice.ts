import { FieldValidator } from "./base";
import type { SelectFieldConfig, RadioFieldConfig } from "../types";

// Shared by "select" and "radio" — both are single-choice-from-options,
// just a different widget.
export class SingleChoiceValidator extends FieldValidator<SelectFieldConfig | RadioFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: SelectFieldConfig | RadioFieldConfig): string | null {
    return config.options.includes(value) ? null : `${config.label} has an invalid value.`;
  }
}
