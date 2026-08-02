import { FieldValidator } from "./base";
import type { CheckboxGroupFieldConfig } from "../types";

export class CheckboxGroupValidator extends FieldValidator<CheckboxGroupFieldConfig, string[]> {
  protected isEmpty(value: string[]): boolean {
    return value.length === 0;
  }

  protected validateValue(value: string[], config: CheckboxGroupFieldConfig): string | null {
    if (value.some((v) => !config.options.includes(v))) {
      return `${config.label} has an invalid value.`;
    }
    if (config.maxSelected && value.length > config.maxSelected) {
      return `${config.label} allows at most ${config.maxSelected} selection${config.maxSelected === 1 ? "" : "s"}.`;
    }
    return null;
  }
}
