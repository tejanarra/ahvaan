import { FieldValidator } from "./base";
import type { AddressFieldConfig, AddressValue } from "../types";

// A compound field validated as one unit rather than decomposed into
// several top-level form fields — required means "the essentials are
// filled in" (street, city, postal code), not "every sub-field." Country
// is deliberately free text (no bundled country list) to keep this field
// dependency-free; a host who needs a constrained country list can use a
// "select" field alongside this one instead.
export class AddressValidator extends FieldValidator<AddressFieldConfig, AddressValue> {
  // Every sub-value, not just line1/city/state/postalCode — a value with
  // only line2 or only country filled in is still "something was entered,"
  // not empty, or a guest's country-only entry would report the base
  // class's generic "is required" message instead of validateValue's more
  // specific missing-street/city/postal-code guidance below.
  protected isEmpty(value: AddressValue): boolean {
    return !value.line1?.trim() && !value.line2?.trim() && !value.city?.trim() && !value.state?.trim() && !value.postalCode?.trim() && !value.country?.trim();
  }

  protected validateValue(value: AddressValue, config: AddressFieldConfig): string | null {
    // The base class only calls validateValue once isEmpty is false — for
    // an *optional* address, a guest who typed just a city or state
    // shouldn't be blocked from submitting over the other parts they
    // didn't fill in (that's what "optional" means); essentials are only
    // mandatory once the field itself is required.
    if (config.required) {
      if (!value.line1?.trim()) return `${config.label} needs a street address.`;
      if (!value.city?.trim()) return `${config.label} needs a city.`;
      if (!value.postalCode?.trim()) return `${config.label} needs a postal code.`;
    }
    if (config.requireLine2 && !value.line2?.trim()) return `${config.label} needs an apartment, suite, or unit.`;
    return null;
  }
}
