import type { TextConfig, TextVariant } from "../types";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";

export const textDefaultConfig: TextConfig = { body: "Add your text here.", variant: "body" };

const VARIANT_OPTIONS: { value: TextVariant; label: string }[] = [
  { value: "body", label: "Body" },
  { value: "subheading", label: "Subheading" },
  { value: "heading", label: "Heading" },
  { value: "title", label: "Title" },
];

// Real, distinct type steps (not just a bigger font-size) — heading/title
// switch to the site's own display serif (the same font-display utility
// every marketing/auth headline uses) so a "Heading" text block actually
// reads as one, not just larger body text.
export const TEXT_VARIANT_CLASSES: Record<TextVariant, string> = {
  body: "text-sm leading-relaxed",
  subheading: "text-base font-semibold leading-snug",
  heading: "font-display text-2xl leading-tight",
  title: "font-display text-4xl leading-[1.1]",
};

export function TextEdit({
  config,
  onChange,
}: {
  config: TextConfig;
  onChange: (next: TextConfig) => void;
}) {
  const variant = config.variant ?? "body";

  return (
    <div className="space-y-3">
      <Field label="Style">
        <ToggleGroup
          size="md"
          options={VARIANT_OPTIONS}
          value={variant}
          onChange={(v) => onChange({ ...config, variant: v as TextVariant })}
        />
      </Field>
      <Field label="Text">
        <Textarea value={config.body} onChange={(e) => onChange({ ...config, body: e.target.value })} rows={5} />
      </Field>
      <Field label="Color">
        {config.color ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ ...config, color: e.target.value })}
              className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
            />
            <button
              type="button"
              onClick={() => onChange({ ...config, color: undefined })}
              className="text-xs text-accent hover:underline"
            >
              Use theme color instead
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ ...config, color: "#000000" })}
            className="rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
          >
            Using theme color — override…
          </button>
        )}
      </Field>
    </div>
  );
}

export function TextRender({ config }: { config: TextConfig }) {
  const variant = config.variant ?? "body";
  return (
    <p
      className={`w-full whitespace-pre-wrap ${TEXT_VARIANT_CLASSES[variant]} ${config.color ? "" : "text-[var(--t-fg)]/85"}`}
      style={config.color ? { color: config.color } : undefined}
    >
      {config.body}
    </p>
  );
}
