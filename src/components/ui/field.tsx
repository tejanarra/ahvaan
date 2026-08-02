import { Fragment, useId, isValidElement, cloneElement } from "react";
import type { ReactNode, ReactElement } from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

// Generates and wires an id between the label and its control automatically
// (docs-audit H4) — every call site previously had to remember to pass
// both `htmlFor` and a matching `id` on the child itself, and none did, so
// the rendered <label> was never programmatically associated with its
// input (screen readers can't announce the field name on focus). `htmlFor`
// stays as an explicit override for the rare case a single child isn't
// the right target (e.g. a custom control that manages its own internal
// input).
export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  const generatedId = useId();
  // Excludes Fragment: it's a valid element per isValidElement, but doesn't
  // accept an `id` prop (React would warn "Invalid prop `id` supplied to
  // `React.Fragment`") — a caller passing `<>...</>` with multiple children
  // just falls back to no auto-association, same as the array/multi-child
  // case below, rather than triggering that warning.
  const child = isValidElement<{ id?: string }>(children) && children.type !== Fragment ? children : null;
  const resolvedId = htmlFor ?? child?.props.id ?? generatedId;

  const content =
    child && !child.props.id && !htmlFor ? cloneElement(child as ReactElement<{ id?: string }>, { id: resolvedId }) : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={resolvedId}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {content}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
