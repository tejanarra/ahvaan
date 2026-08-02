"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BaseConfigFields } from "../field-config-fields";
import type { TextFieldConfig } from "../types";

export function TextFieldEdit({ config, onChange }: { config: TextFieldConfig; onChange: (next: TextFieldConfig) => void }) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} />
      <Field label="Max length" hint="Leave blank for no limit.">
        <Input
          type="number"
          min={1}
          value={config.maxLength ?? ""}
          onChange={(e) => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
    </div>
  );
}

export function TextFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: TextFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <Input
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        maxLength={config.maxLength}
        invalid={Boolean(error)}
      />
    </Field>
  );
}
