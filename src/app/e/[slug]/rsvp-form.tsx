"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitRsvp, type RsvpFormState } from "./actions";
import { VenueMap } from "@/components/venue-map";
import { findFieldByRole } from "@/lib/schemas/form-schema";
import type { FormField, FormSchema, Responses } from "@/lib/schemas/form-schema";
import { buildSandboxSrcDoc } from "@/lib/blocks/sandbox";
import { applyComponentShortcodes } from "@/lib/blocks/shortcodes";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";

const initialState: RsvpFormState = { status: "idle" };

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]";

const inputClass =
  "mt-1.5 w-full rounded-md border border-[var(--t-accent)]/30 bg-transparent px-3 py-2 text-sm text-[var(--t-fg)] placeholder:text-[var(--t-fg)]/45 focus:border-[var(--t-accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]/20";

const choiceButtonClass = (active: boolean) =>
  `cursor-pointer rounded-md border px-3.5 py-1.5 text-sm capitalize transition-colors ${
    active
      ? "border-[var(--t-accent-dark)] bg-[var(--t-accent-dark)] text-white"
      : "border-[var(--t-accent)]/30 text-[var(--t-fg)]/80 hover:border-[var(--t-accent-dark)]"
  }`;

type GuestField = { key: number; value: string };

function toGuestFields(names: string[]): GuestField[] {
  return names.map((value, i) => ({ key: i, value }));
}

function asString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function asArray(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function formatFieldValue(field: FormField, value: string | string[] | undefined): string {
  if (field.type === "plus_ones" || field.type === "checkbox") {
    const list = asArray(value);
    return list.length > 0 ? list.join(", ") : "—";
  }
  if (field.role === "attending") {
    return asString(value) === "yes" ? "Yes" : "No";
  }
  const str = asString(value);
  return str || "—";
}

function PlusOnesField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const fields = toGuestFields(asArray(value));
  const nextKey = useRef(fields.length);
  const [items, setItems] = useState<GuestField[]>(fields);

  const commit = (next: GuestField[]) => {
    setItems(next);
    onChange(next.map((f) => f.value));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={labelClass}>{field.label}</label>
        <button
          type="button"
          onClick={() => commit([...items, { key: nextKey.current++, value: "" }])}
          disabled={field.maxItems !== undefined && items.length >= field.maxItems}
          className="text-sm font-medium text-[var(--t-accent-dark)] hover:opacity-80 disabled:opacity-40"
        >
          + Add guest
        </button>
      </div>
      <div className="mt-1.5 space-y-1.5">
        {items.map((item, index) => (
          <div key={item.key} className="flex items-center gap-2">
            <input
              type="text"
              name={field.id}
              value={item.value}
              onChange={(e) =>
                commit(items.map((f) => (f.key === item.key ? { ...f, value: e.target.value } : f)))
              }
              placeholder={`Guest ${index + 1} name`}
              maxLength={field.maxLength}
              className={inputClass + " mt-0"}
            />
            <button
              type="button"
              onClick={() => commit(items.filter((f) => f.key !== item.key))}
              className="shrink-0 text-[var(--t-fg)]/50 hover:text-[var(--t-fg)]/80"
              aria-label="Remove guest"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="pt-1 text-sm italic text-[var(--t-fg)]/60">
            Coming with someone? Click &ldquo;Add guest&rdquo; to include their name.
          </p>
        )}
      </div>
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}) {
  if (field.type === "plus_ones") {
    return <PlusOnesField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "radio") {
    const current = asString(value);
    return (
      <fieldset>
        <legend className={labelClass}>{field.label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className={choiceButtonClass(current === option)}>
              <input
                type="radio"
                name={field.id}
                value={option}
                required={field.required}
                checked={current === option}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <select
          name={field.id}
          required={field.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            {field.placeholder ?? "Select..."}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "checkbox") {
    const current = asArray(value);
    return (
      <fieldset>
        <legend className={labelClass}>{field.label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const checked = current.includes(option);
            return (
              <label key={option} className={choiceButtonClass(checked)}>
                <input
                  type="checkbox"
                  name={field.id}
                  value={option}
                  checked={checked}
                  onChange={() => onChange(checked ? current.filter((v) => v !== option) : [...current, option])}
                  className="sr-only"
                />
                {option}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <textarea
          name={field.id}
          required={field.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={3}
          className={inputClass}
        />
      </div>
    );
  }

  // "text"
  return (
    <div>
      <label className={labelClass}>{field.label}</label>
      <input
        type="text"
        name={field.id}
        required={field.required}
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={inputClass}
      />
    </div>
  );
}

export function RsvpForm({
  eventId,
  inviteId,
  schema,
  initialResponses,
  guestName,
  venueName,
  venueAddress,
  action,
  readOnly = false,
}: {
  eventId: string;
  inviteId: string;
  schema: FormSchema;
  initialResponses: Responses | null;
  guestName?: string;
  venueName: string | null;
  venueAddress: string | null;
  // What happens right after a guest submits — configurable from the
  // event's Guests → Actions tab (src/lib/schemas/post-submit-actions.ts),
  // not this block's own settings anymore. "message" is RSVP's own rich
  // built-in view (heading(s) + submitted-answers list + optional venue);
  // "redirect"/"custom_html" are handled inline below rather than through
  // the shared <PostSubmitOutcome> (src/lib/forms/post-submit-outcome.tsx)
  // — that component's schema/responses shape is the generic forms engine's,
  // not this RSVP-specific one, and duplicating ~15 lines here beats
  // fighting that type mismatch for two rendering branches.
  action: PostSubmitAction;
  // Past the event's RSVP deadline: a guest who already responded can
  // still see their confirmation, but can't reopen it to edit — the
  // server enforces this too (submitRsvpFromFormData), this just hides an
  // affordance that would otherwise error on click.
  readOnly?: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);

  const nameField = findFieldByRole(schema, "name");
  const prefill: Responses = nameField && guestName ? { [nameField.id]: guestName } : {};

  const [saved, setSaved] = useState<Responses | null>(initialResponses);
  const [mode, setMode] = useState<"view" | "edit">(initialResponses ? "view" : "edit");
  const [values, setValues] = useState<Responses>(initialResponses ?? prefill);

  useEffect(() => {
    if (state.status === "success" && state.data) {
      setSaved(state.data.responses);
      setValues(state.data.responses);
      setMode("view");
    }
  }, [state]);

  // Hooks can't be called conditionally — this always runs, and only
  // *acts* once a redirect action needs to fire.
  useEffect(() => {
    if (mode === "view" && saved && action.kind === "redirect") {
      window.location.href = action.url;
    }
  }, [mode, saved, action]);

  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");
  const isDeclining = attendingField ? asString(values[attendingField.id]) === "no" : false;

  const venueMap = venueAddress && action.kind === "message" && action.showVenue && (
    <VenueMap venueName={venueName || "Venue"} venueAddress={venueAddress} />
  );

  if (mode === "view" && saved) {
    if (action.kind === "redirect") {
      return <p className="w-full text-center text-sm text-[var(--t-fg)]/70">Redirecting…</p>;
    }

    if (action.kind === "custom_html") {
      const height = Number.isFinite(action.heightPx) ? Math.min(4000, Math.max(50, action.heightPx)) : 300;
      const html = applyComponentShortcodes(action.html, {
        eventId,
        inviteId,
        venueName,
        venueAddress,
        schema,
        responses: saved,
      });
      return (
        <iframe
          srcDoc={buildSandboxSrcDoc({ html, css: action.css, js: "" })}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          title="RSVP confirmation"
          style={{ height: `${height}px` }}
          className="w-full rounded-lg border-0"
        />
      );
    }

    const headingField = findFieldByRole(schema, "attending");
    const heading = headingField
      ? asString(saved[headingField.id]) === "yes"
        ? action.heading
        : action.headingNo || action.heading
      : action.heading;

    return (
      <div className="w-full space-y-6">
        <div className="rounded-lg border border-[var(--t-accent)]/25 bg-[var(--t-surface)] p-5 text-center sm:p-6">
          <p
            className="text-xl text-[var(--t-accent-dark)]"
            style={{ fontFamily: "var(--t-font-display)" }}
          >
            {heading}
          </p>
          <div className="mt-4 space-y-1.5 text-sm text-[var(--t-fg)]/90">
            {schema.fields.map((field) => (
              <p key={field.id}>
                <span className="text-xs uppercase tracking-wider text-[var(--t-accent-dark)]">{field.label}: </span>
                {formatFieldValue(field, saved[field.id])}
              </p>
            ))}
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setValues(saved);
                setMode("edit");
              }}
              className="mt-4 rounded-md border border-[var(--t-accent)]/30 px-4 py-1.5 text-sm text-[var(--t-accent-dark)] transition hover:border-[var(--t-accent-dark)]"
            >
              Edit RSVP
            </button>
          )}
        </div>

        {venueMap}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="inviteId" value={inviteId} />

        {schema.fields
          .filter((field) => !(isDeclining && plusOnesField && field.id === plusOnesField.id))
          .map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(next) => setValues((v) => ({ ...v, [field.id]: next }))}
            />
          ))}

        {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-md bg-[var(--t-accent-dark)] px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit RSVP"}
          </button>
          {saved && (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-md border border-[var(--t-accent)]/30 px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-[var(--t-accent-dark)] transition hover:border-[var(--t-accent-dark)]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {saved && venueMap}
    </div>
  );
}
