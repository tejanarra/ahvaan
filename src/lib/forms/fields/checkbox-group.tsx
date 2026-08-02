"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <div className="space-y-1.5">
        {config.options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              name={config.id}
              value={option}
              checked={selected.includes(option)}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, option] : selected.filter((v) => v !== option))
              }
            />
            {option}
          </label>
        ))}
      </div>
    </Field>
  );
}
