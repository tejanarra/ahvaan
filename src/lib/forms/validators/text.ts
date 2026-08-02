import { FieldValidator } from "./base";
import type { TextFieldConfig, TextareaFieldConfig } from "../types";

// Shared by both "text" and "textarea" — same rule (an optional cap on
// length), different widget.
export class TextValidator extends FieldValidator<TextFieldConfig | TextareaFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: TextFieldConfig | TextareaFieldConfig): string | null {
    if (config.maxLength && value.length > config.maxLength) {
      return `${config.label} must be ${config.maxLength} characters or fewer.`;
    }
    return null;
  }
}
