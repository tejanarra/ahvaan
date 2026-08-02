"use client";

import { Field } from "@/components/ui/field";
import { PublicField, PublicChoiceOption } from "@/app/events/[slug]/public-field-ui";
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
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <div className="mt-2 flex flex-wrap gap-2">
        {config.options.map((option) => (
          <PublicChoiceOption
            key={option}
            active={value === option}
            type="radio"
            name={config.id}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          >
            {option}
          </PublicChoiceOption>
        ))}
      </div>
    </PublicField>
  );
}
