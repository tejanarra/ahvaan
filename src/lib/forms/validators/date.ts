import { FieldValidator } from "./base";
import type { DateFieldConfig } from "../types";

// Native <input type="date"> always produces/accepts "YYYY-MM-DD" — kept
// as that exact string (not a Date/timestamp) so it round-trips through
// JSONB with no timezone ambiguity, and so plain string comparison against
// minDate/maxDate (also "YYYY-MM-DD") is correct.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class DateValidator extends FieldValidator<DateFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: DateFieldConfig): string | null {
    if (!DATE_RE.test(value) || Number.isNaN(new Date(value).getTime())) {
      return `${config.label} must be a valid date.`;
    }
    if (config.minDate && value < config.minDate) return `${config.label} must be on or after ${config.minDate}.`;
    if (config.maxDate && value > config.maxDate) return `${config.label} must be on or before ${config.maxDate}.`;
    return null;
  }
}
