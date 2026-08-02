import { FieldValidator } from "./base";
import type { DateFieldConfig } from "../types";

// Native <input type="date"> always produces/accepts "YYYY-MM-DD" — kept
// as that exact string (not a Date/timestamp) so it round-trips through
// JSONB with no timezone ambiguity, and so plain string comparison against
// minDate/maxDate (also "YYYY-MM-DD") is correct.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// `new Date("2024-02-31")` doesn't produce NaN — JS's Date constructor
// rolls impossible calendar dates over into the next month (2024-03-02 in
// this example) instead of rejecting them. Only reachable by a hand-posted
// request (the browser's own <input type="date"> never produces one), but
// this function is also the last line of defense for that path — comparing
// the constructed date's own components back against the input catches the
// rollover.
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export class DateValidator extends FieldValidator<DateFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: DateFieldConfig): string | null {
    if (!DATE_RE.test(value) || !isRealCalendarDate(value)) {
      return `${config.label} must be a valid date.`;
    }
    if (config.minDate && value < config.minDate) return `${config.label} must be on or after ${config.minDate}.`;
    if (config.maxDate && value > config.maxDate) return `${config.label} must be on or before ${config.maxDate}.`;
    return null;
  }
}
