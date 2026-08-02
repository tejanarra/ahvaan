"use client";

import { PublicCheckboxToggle } from "@/app/events/[slug]/public-field-ui";
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
    <div>
      <label className="flex items-start gap-2 text-sm text-[var(--t-fg)]">
        <PublicCheckboxToggle
          className="mt-0.5"
          name={config.id}
          value="true"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
        />
        <span>
          {config.label}
          {config.required && <span className="ml-0.5 text-[var(--t-accent-dark)]">*</span>}
        </span>
      </label>
      {config.helpText && <p className="mt-1 pl-6 text-xs text-[var(--t-fg)]/60">{config.helpText}</p>}
      {error && <p className="mt-1 pl-6 text-xs text-red-600">{error}</p>}
    </div>
  );
}
