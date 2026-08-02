"use client";

import { useActionState, useState } from "react";
import { submitCustomForm, type CustomFormState } from "./actions";
import { FIELD_TYPE_REGISTRY } from "@/lib/forms/registry";
import { PostSubmitOutcome } from "@/lib/forms/post-submit-outcome";
import type { CustomFormSchema, FormResponses, CustomFormField, FieldValue } from "@/lib/forms/types";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";

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
  schema,
  action,
}: {
  formId: string;
  schema: CustomFormSchema;
  action: PostSubmitAction;
}) {
  const [state, formAction, pending] = useActionState(submitCustomForm, initialState);
  const [values, setValues] = useState<FormResponses>({});

  if (state.status === "success" && state.data) {
    return <PostSubmitOutcome action={action} schema={schema} responses={state.data.responses} />;
  }

  return (
    <form action={formAction} className="w-full space-y-4">
      <input type="hidden" name="formId" value={formId} />

      {schema.fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(next) => setValues((v) => ({ ...v, [field.id]: next }))}
          error={state.status === "error" ? state.fieldErrors?.[field.id] : null}
        />
      ))}

      {state.status === "error" && !state.fieldErrors && <p className="text-sm font-medium text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--t-accent-dark)] px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
