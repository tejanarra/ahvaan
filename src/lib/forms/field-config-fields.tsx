"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TrashIcon, PlusIcon } from "@/components/icons";
import type { BaseFieldConfig } from "./types";

// The label/required/placeholder/help-text quartet is identical across
// every field kind — lifted out once so each kind's own Edit component
// (src/lib/forms/fields/*.tsx) only has to render its type-specific extras
// (options list, min/max, etc.) on top of this.
export function BaseConfigFields<C extends BaseFieldConfig>({
  config,
  onChange,
  showPlaceholder = true,
}: {
  config: C;
  onChange: (next: C) => void;
  showPlaceholder?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label="Question / label" required>
        <Input value={config.label} onChange={(e) => onChange({ ...config, label: e.target.value })} />
      </Field>
      {showPlaceholder && (
        <Field label="Placeholder" hint="Shown inside the empty field as an example.">
          <Input
            value={config.placeholder ?? ""}
            onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
          />
        </Field>
      )}
      <Field label="Help text" hint="Shown below the field, above any error.">
        <Input value={config.helpText ?? ""} onChange={(e) => onChange({ ...config, helpText: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={config.required} onChange={(e) => onChange({ ...config, required: e.target.checked })} />
        Required
      </label>
    </div>
  );
}

// Add/remove/edit a list of option strings — shared by select, radio, and
// checkbox_group, the three kinds with a host-defined option set.
export function OptionsListEditor({ options, onChange }: { options: string[]; onChange: (next: string[]) => void }) {
  return (
    <Field label="Options">
      <div className="space-y-1.5">
        {options.map((option, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={option}
              onChange={(e) => onChange(options.map((o, j) => (j === i ? e.target.value : o)))}
              placeholder={`Option ${i + 1}`}
            />
            <IconButton
              type="button"
              variant="ghost"
              aria-label="Remove option"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...options, ""])}>
          <PlusIcon className="h-3.5 w-3.5" />
          Add option
        </Button>
      </div>
    </Field>
  );
}
