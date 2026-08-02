"use client";

import { PublicField, PublicInput } from "@/app/events/[slug]/public-field-ui";
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
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <PublicInput
        type="email"
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder || "name@example.com"}
        invalid={Boolean(error)}
      />
    </PublicField>
  );
}
