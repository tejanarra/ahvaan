import type { SpacerConfig } from "../types";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const spacerDefaultConfig: SpacerConfig = { heightPx: 32 };

export function SpacerEdit({
  config,
  onChange,
}: {
  config: SpacerConfig;
  onChange: (next: SpacerConfig) => void;
}) {
  return (
    <Field label="Height">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={4}
          max={400}
          value={config.heightPx}
          onChange={(e) => onChange({ heightPx: Number(e.target.value) || 0 })}
          className="w-24"
        />
        <span className="text-sm text-muted">px tall</span>
      </div>
    </Field>
  );
}

export function SpacerRender({ config }: { config: SpacerConfig }) {
  // The Edit control clamps to 4–400, but a hand-edited JSON schema can set
  // anything (negative, NaN, absurdly large) — clamp here too so a bad value
  // degrades to "no spacer" instead of negative/invalid CSS or a huge blank
  // page.
  const height = Number.isFinite(config.heightPx) ? Math.min(2000, Math.max(0, config.heightPx)) : 0;
  return <div style={{ height: `${height}px` }} />;
}
