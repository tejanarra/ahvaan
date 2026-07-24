"use client";

import { useState, useTransition } from "react";
import { deleteRsvp } from "./actions";

export function DeleteRsvpButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError("");
    startTransition(async () => {
      try {
        await deleteRsvp(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete RSVP.");
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-foreground/60">Delete {name}?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Confirm"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-md border border-gold/30 px-2.5 py-1 text-xs font-medium text-foreground/70 transition hover:bg-lavender/30"
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
      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
    >
      Delete
    </button>
  );
}
