"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BaseConfigFields } from "../field-config-fields";
import type { PhoneFieldConfig } from "../types";

export function PhoneFieldEdit({ config, onChange }: { config: PhoneFieldConfig; onChange: (next: PhoneFieldConfig) => void }) {
  return <BaseConfigFields config={config} onChange={onChange} />;
}

export function PhoneFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: PhoneFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <Input
        type="tel"
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder || "+1 (555) 123-4567"}
        invalid={Boolean(error)}
      />
    </Field>
  );
}
