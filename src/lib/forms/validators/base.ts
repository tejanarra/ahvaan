import type { BaseFieldConfig } from "../types";

// Template-method base class: every concrete validator implements only its
// own type-specific rule (validateValue) and how to recognize "nothing
// entered" for its value shape (isEmpty — a string's empty is "", a
// multi-select's is [], an address's is "every sub-value blank"). The
// required-ness check and the "optional + empty is fine, skip further
// checks" short-circuit live here once, so every subclass gets them for
// free and can't forget to apply them in a different order.
export abstract class FieldValidator<TConfig extends BaseFieldConfig, TValue> {
  protected abstract isEmpty(value: TValue): boolean;
  protected abstract validateValue(value: TValue, config: TConfig): string | null;

  validate(value: TValue | undefined, config: TConfig): string | null {
    const empty = value === undefined || value === null || this.isEmpty(value);
    if (empty) return config.required ? `${config.label} is required.` : null;
    return this.validateValue(value, config);
  }
}
