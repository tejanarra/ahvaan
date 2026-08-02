"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PublicField, PublicInput } from "@/app/events/[slug]/public-field-ui";
import { BaseConfigFields } from "../field-config-fields";
import type { AddressFieldConfig, AddressValue } from "../types";

const EMPTY_ADDRESS: AddressValue = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };

export function AddressFieldEdit({
  config,
  onChange,
}: {
  config: AddressFieldConfig;
  onChange: (next: AddressFieldConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <BaseConfigFields config={config} onChange={onChange} showPlaceholder={false} />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={config.requireLine2 ?? false}
          onChange={(e) => onChange({ ...config, requireLine2: e.target.checked })}
        />
        Require apartment / suite / unit
      </label>
    </div>
  );
}

export function AddressFieldInput({
  config,
  value,
  onChange,
  error,
}: {
  config: AddressFieldConfig;
  value: AddressValue | undefined;
  onChange: (next: AddressValue) => void;
  error?: string | null;
}) {
  const address = value ?? EMPTY_ADDRESS;
  const set = (patch: Partial<AddressValue>) => onChange({ ...address, ...patch });

  return (
    <PublicField label={config.label} required={config.required} error={error ?? undefined} hint={config.helpText}>
      {/* Every PublicInput bakes in its own top margin, meant for the
          single-input-directly-under-a-label case every other field kind
          has — cancelled here (`mt-0`) since this field stacks several
          inputs, and `space-y-2` on this wrapper already provides the gap
          between them (plus its own `mt-1.5` for the gap from the label). */}
      <div className="mt-1.5 space-y-2">
        <PublicInput
          className="mt-0"
          name={`${config.id}.line1`}
          placeholder="Street address"
          value={address.line1}
          onChange={(e) => set({ line1: e.target.value })}
          invalid={Boolean(error)}
        />
        <PublicInput
          className="mt-0"
          name={`${config.id}.line2`}
          placeholder={config.requireLine2 ? "Apartment / suite / unit" : "Apartment / suite / unit (optional)"}
          value={address.line2 ?? ""}
          onChange={(e) => set({ line2: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <PublicInput
            className="mt-0"
            name={`${config.id}.city`}
            placeholder="City"
            value={address.city}
            onChange={(e) => set({ city: e.target.value })}
          />
          <PublicInput
            className="mt-0"
            name={`${config.id}.state`}
            placeholder="State / province"
            value={address.state}
            onChange={(e) => set({ state: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PublicInput
            className="mt-0"
            name={`${config.id}.postalCode`}
            placeholder="Postal code"
            value={address.postalCode}
            onChange={(e) => set({ postalCode: e.target.value })}
          />
          <PublicInput
            className="mt-0"
            name={`${config.id}.country`}
            placeholder="Country"
            value={address.country}
            onChange={(e) => set({ country: e.target.value })}
          />
        </div>
      </div>
    </PublicField>
  );
}
