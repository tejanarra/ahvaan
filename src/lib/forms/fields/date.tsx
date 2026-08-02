"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PublicField, PublicInput } from "@/app/events/[slug]/public-field-ui";
import { BaseConfigFields } from "../field-config-fields";
import type { DateFieldConfig } from "../types";

export function DateFieldEdit({ config, onChange }: { config: DateFieldConfig; onChange: (next: DateFieldConfig) => void }) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Earliest date">
          <Input type="date" value={config.minDate ?? ""} onChange={(e) => onChange({ ...config, minDate: e.target.value || undefined })} />
        </Field>
        <Field label="Latest date">
          <Input type="date" value={config.maxDate ?? ""} onChange={(e) => onChange({ ...config, maxDate: e.target.value || undefined })} />
        </Field>
      </div>
    </div>
  );
}

export function DateFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: DateFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <PublicInput
        type="date"
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        min={config.minDate}
        max={config.maxDate}
        invalid={Boolean(error)}
      />
    </PublicField>
  );
}
