"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BaseConfigFields } from "../field-config-fields";
import type { EmailFieldConfig } from "../types";

export function EmailFieldEdit({ config, onChange }: { config: EmailFieldConfig; onChange: (next: EmailFieldConfig) => void }) {
  return <BaseConfigFields config={config} onChange={onChange} />;
}

export function EmailFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: EmailFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <Input
        type="email"
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder || "name@example.com"}
        invalid={Boolean(error)}
      />
    </Field>
  );
}
