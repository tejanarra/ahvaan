import { CustomForm } from "@/app/events/[slug]/custom-form";
import type { FormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import type { FormRecord } from "@/lib/data/forms";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
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
        <Select
          value={config.formId ?? ""}
          onChange={(e) =>
            onChange({ ...config, formId: e.target.value || null })
          }
        >
          <option value="">Choose a form…</option>
          {availableForms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Heading">
        <Input
          type="text"
          value={config.heading ?? ""}
          onChange={(e) => onChange({ ...config, heading: e.target.value })}
        />
      </Field>
      <Field
        label="Helper text"
        hint="Shown under the heading, above the form fields."
      >
        <Textarea
          value={config.helperText ?? ""}
          onChange={(e) => onChange({ ...config, helperText: e.target.value })}
          rows={3}
        />
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

function InviteOnlyNote() {
  return (
    <div className="w-full text-center">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">By invitation only</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t-fg)]/75">
        This form is only accepted through a personal invite link. If you&rsquo;re expecting one, please check with the host.
      </p>
    </div>
  );
}

export function FormRender({
  config,
  ctx,
}: {
  config: FormBlockConfig;
  ctx: PageRenderContext;
}) {
  const form = config.formId ? ctx.customForms[config.formId] : undefined;
  if (!form) return <NoFormSelectedNote />;

  // Who's allowed to submit is one event-wide setting
  // (ctx.event.submission_mode), not stored per-form — see
  // src/lib/data/forms.ts. Only 'private' requires a personal invite link
  // — re-checked server-side too (submitCustomFormFromFormData), this is
  // just the guest-facing gate, same shape as RsvpFormRender's.
  // 'email_verified' with no invite renders the form itself, but locked
  // (see CustomForm's own `locked` state) until ctx.verifiedEmail is set.
  const mode = parseSubmissionMode(ctx.event.submission_mode);
  if (mode === "private" && !ctx.inviteId) return <InviteOnlyNote />;

  return (
    <div className="w-full">
      {config.heading && (
        <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
          {config.heading}
        </h2>
      )}
      {config.helperText && (
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[var(--t-fg)]/75">
          {config.helperText}
        </p>
      )}
      <div className="mt-4">
        <CustomForm
          // See the matching comment in blocks/rsvp-form.tsx — forces a
          // clean remount on any identity change instead of stale
          // saved/values state surviving a router.refresh().
          key={ctx.inviteId ?? ctx.verifiedEmail ?? "anon"}
          formId={form.id}
          eventId={ctx.event.id}
          schema={form.schema}
          action={form.actions}
          mode={mode}
          inviteId={ctx.inviteId}
          initialResponses={ctx.customFormResponses[form.id] ?? null}
          identityKnown={Boolean(ctx.inviteId) || Boolean(ctx.verifiedEmail)}
        />
      </div>
    </div>
  );
}
