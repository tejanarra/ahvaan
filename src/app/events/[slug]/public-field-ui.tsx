"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// The one place every guest-facing field control (RSVP's own DynamicField
// in rsvp-form.tsx, and every kind in src/lib/forms/fields/*.tsx's
// `*FieldInput` components) gets its styling from — both render on the
// same per-event-themed public page and must look like one form, not two.
// Deliberately NOT the dashboard's `@/components/ui/*` primitives: those
// are styled from the fixed, event-independent tokens in globals.css
// (`bg-background`, `text-foreground`, `border-border`, static `accent`)
// meant for the host-facing dashboard — using them here reads correctly on
// its own but visibly clashes with anything sitting next to it that uses
// the event's actual theme (`--t-fg`/`--t-accent`/`--t-accent-dark`), which
// is exactly the bug this file fixes (see docs/bugs.md item 2 and the
// Aug 2 screenshot: a Forms field rendered as an opaque light box with a
// dashboard-green button on a dark event theme).
export const publicLabelClass = "block text-xs font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]";

export const publicInputClass =
  "mt-1.5 w-full rounded-md border border-[var(--t-accent)]/30 bg-transparent px-3 py-2 text-sm text-[var(--t-fg)] placeholder:text-[var(--t-fg)]/45 focus:border-[var(--t-accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50";

export const publicInvalidInputClass = "border-red-600/50 focus:border-red-600 focus:ring-red-600/20";

// Renders a radio/checkbox option as a filled pill when selected, rather
// than a native OS radio dot/checkbox box — matches RSVP's own choice
// fields (rsvp-form.tsx's `choiceButtonClass`) exactly.
export const publicChoiceButtonClass = (active: boolean) =>
  `cursor-pointer rounded-md border px-3.5 py-1.5 text-sm capitalize transition-colors ${
    active
      ? "border-[var(--t-accent-dark)] bg-[var(--t-accent-dark)] text-white"
      : "border-[var(--t-accent)]/30 text-[var(--t-fg)]/80 hover:border-[var(--t-accent-dark)]"
  }`;

function withInvalid(base: string, invalid: boolean | undefined, className: string | undefined) {
  return [base, invalid && publicInvalidInputClass, className].filter(Boolean).join(" ");
}

// Layout wrapper mirroring @/components/ui/field.tsx's API (label/
// required/error/hint/children), themed with the event's own palette.
export function PublicField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className={publicLabelClass}>
          {label}
          {required && <span className="ml-0.5 text-[var(--t-accent-dark)]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--t-fg)]/60">{hint}</p>
      ) : null}
    </div>
  );
}

export function PublicInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={withInvalid(publicInputClass, invalid, className)} {...props} />;
}

export function PublicTextarea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={withInvalid(publicInputClass, invalid, className)} {...props} />;
}

export function PublicSelect({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={withInvalid(publicInputClass, invalid, className)} {...props}>
      {children}
    </select>
  );
}

// A single checkbox/radio option rendered as a pill button (see
// publicChoiceButtonClass) — the native input is visually hidden
// (`sr-only`) but stays for a11y/keyboard/form-semantics.
export function PublicChoiceOption({
  active,
  children,
  className,
  ...inputProps
}: { active: boolean; children: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={publicChoiceButtonClass(active)}>
      <input {...inputProps} className={["sr-only", className].filter(Boolean).join(" ")} />
      {children}
    </label>
  );
}

// A real (non-pill) checkbox for a single yes/no toggle (e.g. "I agree to
// the terms") — a filled pill reads oddly for that phrasing, so this stays
// box-shaped, just themed instead of using the dashboard's static accent.
export function PublicCheckboxToggle(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 shrink-0 rounded border-[var(--t-accent)]/40 accent-[var(--t-accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]/20"
      {...props}
    />
  );
}
