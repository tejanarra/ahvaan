"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PublicField, PublicChoiceOption } from "@/app/events/[slug]/public-field-ui";
import { BaseConfigFields, OptionsListEditor } from "../field-config-fields";
import type { CheckboxGroupFieldConfig } from "../types";

export function CheckboxGroupFieldEdit({
  config,
  onChange,
}: {
  config: CheckboxGroupFieldConfig;
  onChange: (next: CheckboxGroupFieldConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />
      <OptionsListEditor options={config.options} onChange={(options) => onChange({ ...config, options })} />
      <Field label="Max selections" hint="Leave blank to allow any number.">
        <Input
          type="number"
          min={1}
          value={config.maxSelected ?? ""}
          onChange={(e) => onChange({ ...config, maxSelected: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
    </div>
  );
}

export function CheckboxGroupFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: CheckboxGroupFieldConfig;
  value: string[] | undefined;
  onChange: (next: string[]) => void;
  error?: string | null;
}) {
  const selected = value ?? [];
  // Stop the guest from checking past maxSelected client-side, rather than
  // letting them submit an over-selection that the server then rejects —
  // the disabled state below is only advisory (the server still enforces
  // this for real, see CheckboxGroupValidator), but surfacing it here
  // means a guest can't check option N+1 without first unchecking one.
  const atMax = Boolean(config.maxSelected) && selected.length >= config.maxSelected!;
  return (
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <div className="mt-2 flex flex-wrap gap-2">
        {config.options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <PublicChoiceOption
              key={option}
              active={isSelected}
              type="checkbox"
              name={config.id}
              value={option}
              checked={isSelected}
              disabled={atMax && !isSelected}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, option] : selected.filter((v) => v !== option))
              }
            >
              {option}
            </PublicChoiceOption>
          );
        })}
      </div>
    </PublicField>
  );
}
