"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { BaseConfigFields } from "../field-config-fields";
import type { CheckboxFieldConfig } from "../types";

export function CheckboxFieldEdit({
  config,
  onChange,
}: {
  config: CheckboxFieldConfig;
  onChange: (next: CheckboxFieldConfig) => void;
}) {
  return <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />;
}

export function CheckboxFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: CheckboxFieldConfig;
  value: string | undefined;
  onChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2 text-sm text-foreground">
        <Checkbox
          className="mt-0.5"
          name={config.id}
          value="true"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
        />
        <span>
          {config.label}
          {config.required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
      </label>
      {config.helpText && <p className="pl-6 text-xs text-muted-foreground">{config.helpText}</p>}
      {error && <p className="pl-6 text-xs text-destructive">{error}</p>}
    </div>
  );
}
