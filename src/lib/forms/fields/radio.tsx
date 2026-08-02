"use client";

import { Field } from "@/components/ui/field";
import { BaseConfigFields, OptionsListEditor } from "../field-config-fields";
import type { RadioFieldConfig } from "../types";

export function RadioFieldEdit({ config, onChange }: { config: RadioFieldConfig; onChange: (next: RadioFieldConfig) => void }) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />
      <OptionsListEditor options={config.options} onChange={(options) => onChange({ ...config, options })} />
    </div>
  );
}

export function RadioFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: RadioFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <div className="space-y-1.5">
        {config.options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name={config.id}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    </Field>
  );
}
