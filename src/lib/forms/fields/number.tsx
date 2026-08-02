"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicField, PublicInput } from "@/app/events/[slug]/public-field-ui";
import { BaseConfigFields } from "../field-config-fields";
import type { NumberFieldConfig } from "../types";

export function NumberFieldEdit({ config, onChange }: { config: NumberFieldConfig; onChange: (next: NumberFieldConfig) => void }) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min">
          <Input
            type="number"
            value={config.min ?? ""}
            onChange={(e) => onChange({ ...config, min: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <Field label="Max">
          <Input
            type="number"
            value={config.max ?? ""}
            onChange={(e) => onChange({ ...config, max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={config.integer ?? false} onChange={(e) => onChange({ ...config, integer: e.target.checked })} />
        Whole numbers only
      </label>
    </div>
  );
}

export function NumberFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: NumberFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <PublicInput
        type="number"
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        min={config.min}
        max={config.max}
        step={config.integer ? 1 : "any"}
        invalid={Boolean(error)}
      />
    </PublicField>
  );
}
