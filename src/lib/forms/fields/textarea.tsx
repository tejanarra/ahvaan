"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BaseConfigFields } from "../field-config-fields";
import type { TextareaFieldConfig } from "../types";

export function TextareaFieldEdit({
  config,
  onChange,
}: {
  config: TextareaFieldConfig;
  onChange: (next: TextareaFieldConfig) => void;
}) {
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

export function TextareaFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: TextareaFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <Field label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      <Textarea
        name={config.id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        maxLength={config.maxLength}
        rows={4}
        invalid={Boolean(error)}
      />
    </Field>
  );
}
