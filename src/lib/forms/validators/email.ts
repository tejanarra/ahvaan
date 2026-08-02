import { FieldValidator } from "./base";
import type { EmailFieldConfig } from "../types";

// Deliberately permissive (RFC 5322 in full is famously not worth
// implementing by regex) — this is a "did you obviously mistype this"
// check, not a deliverability guarantee.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailValidator extends FieldValidator<EmailFieldConfig, string> {
  protected isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  protected validateValue(value: string, config: EmailFieldConfig): string | null {
    return EMAIL_RE.test(value.trim()) ? null : `${config.label} must be a valid email address.`;
  }
}
