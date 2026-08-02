"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";
import { Tooltip } from "./tooltip";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalSize = "sm" | "lg" | "full";

// `cn` here is a plain concatenator (no tailwind-merge-style dedup — see
// src/lib/cn.ts), so a hardcoded width class in the base string and a
// conflicting one passed via `className` would both end up in the class
// list, with the winner decided by arbitrary CSS generation order rather
// than which was passed last. `size` is the one width knob callers use
// instead, so `className` never needs to carry a width/max-w utility.
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "w-full max-w-sm",
  lg: "w-full max-w-2xl",
  full: "w-[98vw] max-w-[1600px]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: ModalSize;
}

export function Modal({ open, onClose, title, children, className, size = "sm" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape-to-close (existing), plus a Tab-cycling focus trap (WCAG 2.4.3 —
  // previously absent, so Tab could move focus out of the dialog into the
  // page behind it). Re-reads focusable elements from the DOM on every
  // Tab press rather than caching them once, since a dialog's content can
  // change while open (e.g. a form growing an error message with a new
  // focusable link).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Move focus into the dialog on open, and back to whatever triggered it
  // on close — without this, focus silently stays on (or returns to) the
  // trigger button behind an overlay, which is disorienting for keyboard/
  // screen-reader users.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Several callers (ShareInviteButton's guest-name field,
    // EditRsvpDialog's inputs, ...) already set `autoFocus` on a specific
    // body field — React applies that before this effect runs, so if focus
    // already landed somewhere inside the dialog, leave it alone. Without
    // this check, this effect would unconditionally grab focus onto the
    // Close button instead (it's first in DOM order, in the title row,
    // ahead of `children`), silently overriding every caller's own
    // autoFocus choice.
    if (!dialogRef.current?.contains(document.activeElement)) {
      const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? dialogRef.current)?.focus();
    }

    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    // Mobile (docs/05): the dialog docks to the bottom edge as a full-width
    // sheet instead of floating centered — `items-end` + no outer padding on
    // mobile, reverting to the centered floating card at `sm` and up.
    <div
      // docs/04: backdrop is `rgb(33 30 25 / 0.4)` (warm ink, matching the
      // Studio's own foreground token) — was a plain `bg-black/30`
      // (docs-audit H2).
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(33_30_25/0.4)] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          SIZE_CLASSES[size],
          // Always a flex column with a viewport-relative height cap, so the
          // content pane below can actually scroll internally instead of the
          // whole dialog overflowing the viewport — previously this only
          // worked when a caller's own className happened to add both.
          // docs/04: Modal is `--radius-lg` + `--shadow-modal` (was
          // `rounded-lg`/8px + a generic `shadow-lg`, docs-audit H2) — the
          // one component these tokens are literally named after.
          "flex max-h-[85dvh] flex-col rounded-t-[var(--radius-lg)] border border-border bg-background shadow-[var(--shadow-modal)] sm:max-h-[80vh] sm:rounded-[var(--radius-lg)]",
          className
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <Tooltip content="Close">
              <IconButton aria-label="Close" onClick={onClose}>
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </IconButton>
            </Tooltip>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
