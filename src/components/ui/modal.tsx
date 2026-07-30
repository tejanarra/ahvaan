"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";

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
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(SIZE_CLASSES[size], "rounded-lg border border-border bg-background shadow-lg", className)}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <IconButton aria-label="Close" onClick={onClose}>
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>
          </div>
        )}
        {/* min-h-0 only takes effect when the caller's className also makes
            this dialog a flex column with a fixed height (e.g. the page
            builder's block-edit modal) — a no-op otherwise, so existing
            auto-height modal usages are unaffected. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
