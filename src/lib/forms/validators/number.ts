import { FieldValidator } from "./base";
import type { NumberFieldConfig } from "../types";

// A plain decimal number only — optional sign, digits, optional fraction,
// optional exponent. `Number(value)` alone also accepts things a guest
// almost certainly didn't intend for a numeric field: "0x10"/"0o17"/"0b11"
// (hex/octal/binary literals), "Infinity"/"-Infinity" (not finite, breaks
// min/max comparisons), and "" (empty string coerces to 0, though isEmpty
// above already short-circuits a truly blank value).
const DECIMAL_RE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

// Stored/transmitted as a string (like every other scalar field value) —
// parsed here, not at storage time, so the raw guest-entered text survives
// round-trips even if it's later rejected.
export class NumberValidator extends FieldValidator<NumberFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: NumberFieldConfig): string | null {
    const trimmed = value.trim();
    if (!DECIMAL_RE.test(trimmed)) return `${config.label} must be a number.`;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return `${config.label} must be a number.`;
    if (config.integer && !Number.isInteger(n)) return `${config.label} must be a whole number.`;
    if (config.min !== undefined && n < config.min) return `${config.label} must be at least ${config.min}.`;
    if (config.max !== undefined && n > config.max) return `${config.label} must be at most ${config.max}.`;
    return null;
  }
}
