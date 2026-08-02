import { FieldValidator } from "./base";
import type { PhoneFieldConfig } from "../types";

// International-friendly, not locale-strict: allows an optional leading
// "+", digits, spaces, dashes, dots, and parens, then separately checks the
// digit-only count falls in a plausible phone-number range (7-15, the E.164
// max) — catches "definitely not a phone number" input without rejecting
// legitimate formatting variety across countries.
const PHONE_CHARS_RE = /^\+?[0-9()\-.\s]+$/;

export class PhoneValidator extends FieldValidator<PhoneFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: PhoneFieldConfig): string | null {
    const trimmed = value.trim();
    const digitCount = trimmed.replace(/\D/g, "").length;
    if (!PHONE_CHARS_RE.test(trimmed) || digitCount < 7 || digitCount > 15) {
      return `${config.label} must be a valid phone number.`;
    }
    return null;
  }
}
