import { FieldValidator } from "./base";
import type { AddressFieldConfig, AddressValue } from "../types";

// A compound field validated as one unit rather than decomposed into
// several top-level form fields — required means "the essentials are
// filled in" (street, city, postal code), not "every sub-field." Country
// is deliberately free text (no bundled country list) to keep this field
// dependency-free; a host who needs a constrained country list can use a
// "select" field alongside this one instead.
export class AddressValidator extends FieldValidator<AddressFieldConfig, AddressValue> {
  protected isEmpty(value: AddressValue): boolean {
    return !value.line1?.trim() && !value.city?.trim() && !value.state?.trim() && !value.postalCode?.trim();
  }

  protected validateValue(value: AddressValue, config: AddressFieldConfig): string | null {
    if (!value.line1?.trim()) return `${config.label} needs a street address.`;
    if (!value.city?.trim()) return `${config.label} needs a city.`;
    if (!value.postalCode?.trim()) return `${config.label} needs a postal code.`;
    if (config.requireLine2 && !value.line2?.trim()) return `${config.label} needs an apartment, suite, or unit.`;
    return null;
  }
}
