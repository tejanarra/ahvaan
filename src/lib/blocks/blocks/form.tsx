import { CustomForm } from "@/app/e/[slug]/custom-form";
import type { FormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import type { FormRecord } from "@/lib/data/forms";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export const formDefaultConfig: FormBlockConfig = {
  formId: null,
  heading: "",
  helperText: "",
};

export function FormEdit({
  config,
  onChange,
  availableForms = [],
}: {
  config: FormBlockConfig;
  onChange: (next: FormBlockConfig) => void;
  availableForms?: FormRecord[];
}) {
  return (
    <div className="space-y-3">
      <Field
        label="Which form?"
        hint={
          availableForms.length === 0
            ? "No forms yet — create one under the event's Forms tab, then come back here."
            : undefined
        }
      >
        <Select value={config.formId ?? ""} onChange={(e) => onChange({ ...config, formId: e.target.value || null })}>
          <option value="">Choose a form…</option>
          {availableForms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Heading">
        <Input type="text" value={config.heading ?? ""} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </Field>
      <Field label="Helper text" hint="Shown under the heading, above the form fields.">
        <Textarea value={config.helperText ?? ""} onChange={(e) => onChange({ ...config, helperText: e.target.value })} rows={3} />
      </Field>
    </div>
  );
}

function NoFormSelectedNote() {
  return (
    <div className="w-full rounded-lg border border-dashed border-[var(--t-accent)]/30 p-6 text-center text-sm text-[var(--t-fg)]/60">
      No form selected — pick one in this block&rsquo;s settings.
    </div>
  );
}

export function FormRender({ config, ctx }: { config: FormBlockConfig; ctx: PageRenderContext }) {
  const form = config.formId ? ctx.customForms[config.formId] : undefined;
  if (!form) return <NoFormSelectedNote />;

  return (
    <div className="w-full">
      {config.heading && (
        <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">{config.heading}</h2>
      )}
      {config.helperText && <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[var(--t-fg)]/75">{config.helperText}</p>}
      <div className="mt-4">
        <CustomForm formId={form.id} schema={form.schema} action={form.actions} />
      </div>
    </div>
  );
}
