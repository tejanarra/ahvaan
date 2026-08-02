"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitCustomForm, type CustomFormState } from "./actions";
import { FIELD_TYPE_REGISTRY } from "@/lib/forms/registry";
import { EmailVerificationModal } from "./email-verification-modal";
import { PostSubmitOutcome } from "@/lib/forms/post-submit-outcome";
import type { CustomFormSchema, FormResponses, CustomFormField, FieldValue } from "@/lib/forms/types";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";
import type { SubmissionMode } from "@/lib/schemas/submission-mode";

const initialState: CustomFormState = { status: "idle" };

// The one dynamic-dispatch call site: every field kind's own Input
// component (src/lib/forms/fields/*.tsx) is looked up by `kind` from the
// registry rather than switched on here — adding a new kind never touches
// this file.
function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: CustomFormField;
  value: FieldValue | undefined;
  onChange: (next: FieldValue) => void;
  error?: string | null;
}) {
  const definition = FIELD_TYPE_REGISTRY[field.kind];
  const Input = definition.Input;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Input config={field as any} value={value as any} onChange={onChange as any} error={error} />;
}

export function CustomForm({
  formId,
  eventId,
  schema,
  action,
  mode,
  inviteId,
  initialResponses,
  identityKnown = Boolean(inviteId),
}: {
  formId: string;
  // Needed only for the 'email_verified' verify modal, which is scoped to
  // the event (one verification covers every form on the page), not the
  // form itself.
  eventId: string;
  schema: CustomFormSchema;
  action: PostSubmitAction;
  // Who's allowed to submit / how resubmission is handled
  // (src/lib/schemas/submission-mode.ts). 'anonymous' keeps this
  // component's original behavior exactly (no persistence, no edit
  // affordance — every submit is fresh); 'private' adds view/edit-in-place;
  // 'email_verified' with no invite renders the form `locked` (see below)
  // until `identityKnown`.
  mode: SubmissionMode;
  inviteId: string | null;
  initialResponses: FormResponses | null;
  // True when this guest's identity is already established — either an
  // invite link, or (for 'email_verified' with no invite) having already
  // passed the page-level verification gate
  // (src/lib/blocks/blocks/form.tsx's FormRender computes this from
  // ctx.inviteId/ctx.verifiedEmail). When false in 'email_verified' mode,
  // the form renders visibly but locked (disabled, dimmed, click-to-verify)
  // rather than being hidden outright — see `locked` below.
  identityKnown?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitCustomForm, initialState);
  const initialSaved = mode === "anonymous" ? null : initialResponses;
  const [saved, setSaved] = useState<FormResponses | null>(initialSaved);
  const [viewMode, setViewMode] = useState<"view" | "edit">(initialSaved ? "view" : "edit");
  const [values, setValues] = useState<FormResponses>(initialSaved ?? {});
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const identityEmailFieldId = schema.fields.find((f) => f.kind === "email")?.id ?? null;
  const locked = mode === "email_verified" && !identityKnown;

  useEffect(() => {
    if (state.status === "success" && state.data && mode !== "anonymous" && action.kind === "message") {
      // 'private'/'email_verified' + a plain message action: same rich
      // edit-in-place affordance RSVP has always had, so "submit once,
      // linked to me" behaves the same way in both systems. This reacts to
      // `state` (useActionState's own result, an external system this
      // component doesn't own — a fresh submission, not a prop/render-time
      // value), so it's a one-time transition per submit rather than
      // per-render derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(state.data.responses);
      setValues(state.data.responses);
      setViewMode("view");
    } else if (state.status === "verification_sent") {
      // Shouldn't normally happen — the locked fieldset below disables
      // submission until `identityKnown`. The one way it can: the
      // guest-session cookie expired between this page loading and the
      // guest clicking submit. Refreshing re-runs page.tsx, which re-locks
      // the form behind the verify modal so they can re-establish it
      // properly, rather than leaving them stuck on a submit that
      // silently did nothing.
      router.refresh();
    }
  }, [state, mode, action, router]);

  if (state.status === "success" && state.data && (mode === "anonymous" || action.kind !== "message")) {
    return <PostSubmitOutcome action={action} schema={schema} responses={state.data.responses} />;
  }

  if (viewMode === "view" && saved) {
    return (
      <div className="w-full space-y-4">
        <PostSubmitOutcome action={action} schema={schema} responses={saved} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setValues(saved);
              setViewMode("edit");
            }}
            className="rounded-md border border-[var(--t-accent)]/30 px-4 py-1.5 text-sm text-[var(--t-accent-dark)] transition hover:border-[var(--t-accent-dark)]"
          >
            Edit response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <form action={formAction} className="w-full space-y-4">
          <input type="hidden" name="formId" value={formId} />
          <input type="hidden" name="inviteId" value={inviteId ?? ""} />

          <fieldset disabled={locked} className={`m-0 min-w-0 w-full space-y-4 border-0 p-0 ${locked ? "opacity-60" : ""}`}>

            {schema.fields
              // A guest whose identity is already known (invite link, or
              // already passed the page-level verification gate) never
              // needs the identity email field — same "first email-kind
              // field" resolution as form-submit.ts's findEmailFieldId, so
              // this hides the exact field submission would otherwise use.
              .filter((field) => !(identityKnown && field.id === identityEmailFieldId))
              .map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={(next) => setValues((v) => ({ ...v, [field.id]: next }))}
                  error={state.status === "error" ? state.fieldErrors?.[field.id] : null}
                />
              ))}

            {state.status === "error" && !state.fieldErrors && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {state.message}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-md bg-[var(--t-accent-dark)] px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition disabled:opacity-50"
              >
                {pending ? "Submitting..." : "Submit"}
              </button>
              {saved && (
                <button
                  type="button"
                  onClick={() => setViewMode("view")}
                  className="rounded-md border border-[var(--t-accent)]/30 px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-[var(--t-accent-dark)] transition hover:border-[var(--t-accent-dark)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </fieldset>
        </form>

        {locked && (
          // See the matching comment in rsvp-form.tsx — catches the click
          // itself rather than relying on it bubbling from a disabled
          // control, and opens the verify modal instead.
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            aria-label="Verify your email to respond"
            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          />
        )}
      </div>

      {locked && (
        <EmailVerificationModal eventId={eventId} open={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
      )}
    </div>
  );
}
