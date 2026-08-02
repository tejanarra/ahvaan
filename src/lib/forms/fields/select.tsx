"use client";

import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { PublicField, PublicSelect } from "@/app/events/[slug]/public-field-ui";
import { BaseConfigFields, OptionsListEditor } from "../field-config-fields";
import type { SelectFieldConfig } from "../types";

export function SelectFieldEdit({ config, onChange }: { config: SelectFieldConfig; onChange: (next: SelectFieldConfig) => void }) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />
      <OptionsListEditor options={config.options} onChange={(options) => onChange({ ...config, options })} />
    </div>
  );
}

export function SelectFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: SelectFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <PublicSelect name={config.id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} invalid={Boolean(error)}>
        <option value="">{config.placeholder || "Choose one…"}</option>
        {config.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </PublicSelect>
    </PublicField>
  );
}
