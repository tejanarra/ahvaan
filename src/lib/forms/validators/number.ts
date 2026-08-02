import { FieldValidator } from "./base";
import type { NumberFieldConfig } from "../types";

// Stored/transmitted as a string (like every other scalar field value) —
// parsed here, not at storage time, so the raw guest-entered text survives
// round-trips even if it's later rejected.
export class NumberValidator extends FieldValidator<NumberFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: NumberFieldConfig): string | null {
    const n = Number(value);
    if (Number.isNaN(n)) return `${config.label} must be a number.`;
    if (config.integer && !Number.isInteger(n)) return `${config.label} must be a whole number.`;
    if (config.min !== undefined && n < config.min) return `${config.label} must be at least ${config.min}.`;
    if (config.max !== undefined && n > config.max) return `${config.label} must be at most ${config.max}.`;
    return null;
  }
}
