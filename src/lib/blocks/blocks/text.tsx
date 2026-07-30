import type { TextConfig } from "../types";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export const textDefaultConfig: TextConfig = { body: "Add your text here." };

export function TextEdit({
  config,
  onChange,
}: {
  config: TextConfig;
  onChange: (next: TextConfig) => void;
}) {
  return (
    <Field label="Text">
      <Textarea value={config.body} onChange={(e) => onChange({ ...config, body: e.target.value })} rows={5} />
    </Field>
  );
}

export function TextRender({ config }: { config: TextConfig }) {
  return (
    <p className="w-full whitespace-pre-wrap text-sm leading-relaxed text-[var(--t-fg)]/85">
      {config.body}
    </p>
  );
}
