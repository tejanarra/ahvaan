"use client";

import { useRef, useState, useTransition } from "react";
import { updateRsvp } from "./actions";
import type { RespondedGuest } from "./guest-card";

type GuestField = { key: number; value: string };

function toGuestFields(names: string[]): GuestField[] {
  return names.map((value, i) => ({ key: i, value }));
}

export function EditRsvpDialog({
  guest,
  onClose,
}: {
  guest: RespondedGuest;
  onClose: () => void;
}) {
  const [name, setName] = useState(guest.name);
  const [attending, setAttending] = useState<"yes" | "no">(guest.attending ? "yes" : "no");
  const [guestFields, setGuestFields] = useState<GuestField[]>(
    toGuestFields(guest.additionalGuests)
  );
  const nextKey = useRef(guestFields.length);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const addGuest = () => {
    setGuestFields((fields) => [...fields, { key: nextKey.current++, value: "" }]);
  };

  const removeGuest = (key: number) => {
    setGuestFields((fields) => fields.filter((f) => f.key !== key));
  };

  const updateGuest = (key: number, value: string) => {
    setGuestFields((fields) => fields.map((f) => (f.key === key ? { ...f, value } : f)));
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        await updateRsvp(guest.id, {
          name,
          attending: attending === "yes",
          additionalGuests: guestFields.map((f) => f.value),
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gold/30 bg-white/95 p-6 shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-foreground/50 hover:text-foreground/90"
        >
          ✕
        </button>

        <h2 className="font-display text-lg uppercase tracking-[0.1em] text-gold-dark">
          Edit RSVP
        </h2>

        <div className="mt-4">
          <label className="block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 font-script text-lg text-foreground focus:border-gold-dark focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <span className="block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Attending?
          </span>
          <div className="mt-2 flex gap-2">
            {(["yes", "no"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAttending(value)}
                className={`rounded-full border px-4 py-1.5 font-script text-base transition ${
                  attending === value
                    ? "border-gold-dark bg-gold-dark text-white"
                    : "border-gold/40 text-foreground/80 hover:border-gold-dark"
                }`}
              >
                {value === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        {attending === "yes" && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Plus ones
              </span>
              <button
                type="button"
                onClick={addGuest}
                className="font-script text-base text-gold-dark hover:text-gold"
              >
                + Add guest
              </button>
            </div>
            <div className="mt-1 space-y-1">
              {guestFields.map((field, index) => (
                <div key={field.key} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateGuest(field.key, e.target.value)}
                    placeholder={`Guest ${index + 1} name`}
                    className="mt-0 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 font-script text-lg text-foreground focus:border-gold-dark focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeGuest(field.key)}
                    className="text-foreground/50 hover:text-foreground/80"
                    aria-label="Remove guest"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {guestFields.length === 0 && (
                <p className="pt-1 font-script text-sm italic text-foreground/60">
                  No plus-ones on this RSVP.
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-gold/40 px-4 py-2.5 font-display text-sm uppercase tracking-widest text-gold-dark transition hover:border-gold-dark disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
