"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { TrashIcon } from "./icons";

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
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-destructive/80 transition hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
    >
      {icon ?? <TrashIcon />}
    </button>
  );
}
