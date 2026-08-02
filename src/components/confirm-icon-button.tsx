"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { TrashIcon } from "./icons";
import { IconButton } from "./ui/icon-button";
import { Tooltip } from "./ui/tooltip";

export function ConfirmIconButton({
  icon,
  label,
  confirmText,
  onConfirm,
}: {
  icon?: ReactNode;
  label: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      try {
        await onConfirm();
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="text-xs text-muted">{confirmText}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-white transition hover:bg-destructive-hover disabled:opacity-50"
          >
            {isPending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted transition hover:bg-surface"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    // The outer div, not the button itself, absorbs PageHeader's
    // `actions` slot stretching a lone action to full width on mobile
    // (`*:flex-1`, page-header.tsx) — without it, a fixed-size icon button
    // centers its icon inside that full-width space instead of sitting at
    // the edge, reading as a stray icon floating in empty space rather
    // than a normal top-right action (this exact bug, on the "delete
    // form" action — form-header.tsx's sole PageHeader action).
    <div className="flex justify-end">
      {/* Built on the shared IconButton primitive (docs-audit "Low: misc")
          rather than a hand-rolled <button> — the previous version
          duplicated IconButton's sizing but silently dropped its
          focus-visible ring, regressing keyboard-focus visibility
          relative to every other icon button in the app. */}
      <Tooltip content={label}>
        <IconButton variant="destructive" onClick={() => setConfirming(true)} aria-label={label}>
          {icon ?? <TrashIcon />}
        </IconButton>
      </Tooltip>
    </div>
  );
}
