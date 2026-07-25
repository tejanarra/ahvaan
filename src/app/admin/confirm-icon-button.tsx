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
          <span className="text-xs text-foreground/60">{confirmText}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-md border border-gold/30 px-2 py-1 text-xs font-medium text-foreground/70 transition hover:bg-lavender/30"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-600/80 transition hover:bg-red-50 hover:text-red-600"
    >
      {icon ?? <TrashIcon />}
    </button>
  );
}
