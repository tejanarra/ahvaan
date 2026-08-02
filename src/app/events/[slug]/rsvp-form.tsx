"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitRsvp, type RsvpFormState } from "./actions";
import { VenueMap } from "@/components/venue-map";
import { EmailVerificationModal } from "./email-verification-modal";
import { publicLabelClass as labelClass, publicInputClass as inputClass, publicChoiceButtonClass as choiceButtonClass } from "./public-field-ui";
import { findFieldByRole } from "@/lib/schemas/form-schema";
import type { FormField, FormSchema, Responses } from "@/lib/schemas/form-schema";
import { buildSandboxSrcDoc } from "@/lib/blocks/sandbox";
import { applyComponentShortcodes } from "@/lib/blocks/shortcodes";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";
import type { SubmissionMode } from "@/lib/schemas/submission-mode";

const initialState: RsvpFormState = { status: "idle" };

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
  mode,
  schema,
  initialResponses,
  guestName,
  venueName,
  venueAddress,
  action,
  readOnly = false,
  identityKnown = Boolean(inviteId),
}: {
  eventId: string;
  inviteId: string | null;
  // Who's allowed to submit / how resubmission is handled
  // (src/lib/schemas/submission-mode.ts) — 'private' keeps this component's
  // original behavior (hidden inviteId); 'anonymous' just drops the invite
  // requirement (server-side gating already handles that, this component
  // doesn't need to branch for it); 'email_verified' with no invite
  // renders the form `locked` (see below) until `identityKnown`.
  mode: SubmissionMode;
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
  // True when this guest's identity is already established — either an
  // invite link, or (for 'email_verified' with no invite) having already
  // passed the page-level verification gate
  // (src/lib/blocks/blocks/rsvp-form.tsx's RsvpFormRender computes this
  // from ctx.inviteId/ctx.verifiedEmail). When false in 'email_verified'
  // mode, the form renders visibly but locked (disabled, dimmed, click-to-
  // verify) rather than being hidden outright — see `locked` below.
  identityKnown?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);

  const nameField = findFieldByRole(schema, "name");
  const prefill: Responses = nameField && guestName ? { [nameField.id]: guestName } : {};

  const [saved, setSaved] = useState<Responses | null>(initialResponses);
  const [viewMode, setViewMode] = useState<"view" | "edit">(initialResponses ? "view" : "edit");
  const [values, setValues] = useState<Responses>(initialResponses ?? prefill);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.data) {
      setSaved(state.data.responses);
      setValues(state.data.responses);
      setViewMode("view");
    } else if (state.status === "verification_sent") {
      // Shouldn't normally happen — the locked fieldset below disables
      // submission until `identityKnown`. The one way it can: the
      // guest-session cookie expired in the moments between this page
      // loading and them clicking submit. Refreshing re-runs page.tsx,
      // which re-locks the form behind the verify modal so they can
      // re-establish it properly, rather than leaving them stuck on a
      // response that silently did nothing.
      router.refresh();
    }
  }, [state, router]);

  // Hooks can't be called conditionally — this always runs, and only
  // *acts* once a redirect action needs to fire. Guards against a blank/
  // unusable URL (shouldn't be saveable anymore — see
  // parsePostSubmitActionStrict — but a pre-existing bad row could still
  // be sitting in the database): `window.location.href = ""` navigates to
  // the current URL, which would re-run this same effect on load and
  // reload forever.
  const hasValidRedirectUrl = action.kind === "redirect" && /^https?:\/\//i.test(action.url);
  useEffect(() => {
    if (viewMode === "view" && saved && action.kind === "redirect" && hasValidRedirectUrl) {
      window.location.href = action.url;
    }
  }, [viewMode, saved, action, hasValidRedirectUrl]);

  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");
  const emailField = findFieldByRole(schema, "email");
  const isDeclining = attendingField ? asString(values[attendingField.id]) === "no" : false;
  const locked = mode === "email_verified" && !identityKnown;

  const venueMap = venueAddress && action.kind === "message" && action.showVenue && (
    <VenueMap venueName={venueName || "Venue"} venueAddress={venueAddress} />
  );

  if (viewMode === "view" && saved) {
    if (action.kind === "redirect" && hasValidRedirectUrl) {
      return <p className="w-full text-center text-sm text-[var(--t-fg)]/70">Redirecting…</p>;
    }

    if (action.kind === "redirect") {
      // Unusable URL — fall back to a plain confirmation instead of
      // navigating nowhere (see hasValidRedirectUrl above).
      return <p className="w-full text-center text-sm text-[var(--t-fg)]">Thanks — your response has been recorded.</p>;
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
                setViewMode("edit");
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
      <div className="relative">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="inviteId" value={inviteId ?? ""} />

          <fieldset
            disabled={locked}
            className={`m-0 min-w-0 space-y-4 border-0 p-0 ${locked ? "opacity-60" : ""}`}
          >
            {schema.fields
              .filter((field) => !(isDeclining && plusOnesField && field.id === plusOnesField.id))
              // A guest whose identity is already known (invite link, or
              // already passed the page-level verification gate — see
              // `identityKnown`) never needs the auto-seeded email field;
              // it'd just be a confusing extra field to show someone who
              // doesn't need to fill it in.
              .filter((field) => !(identityKnown && emailField && field.id === emailField.id))
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
          // A disabled fieldset alone won't reliably surface "why can't I
          // click this" — this transparent overlay catches the click
          // itself (a click landing directly on a disabled control isn't
          // guaranteed to bubble) and opens the verify modal instead.
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            aria-label="Verify your email to respond"
            className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          />
        )}
      </div>

      {saved && venueMap}

      {locked && (
        <EmailVerificationModal eventId={eventId} open={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
      )}
    </div>
  );
}
