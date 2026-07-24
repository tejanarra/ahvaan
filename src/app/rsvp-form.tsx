"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitRsvp, type RsvpFormState } from "./actions";

const initialState: RsvpFormState = { status: "idle" };

const labelClass =
  "block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark";

const inputClass =
  "mt-1.5 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 font-script text-lg text-foreground placeholder:font-sans placeholder:text-sm placeholder:text-foreground/45 focus:border-gold-dark focus:outline-none";

export function RsvpForm() {
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [guestCount, setGuestCount] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nameFromLink = new URLSearchParams(window.location.search).get("name");
    if (nameFromLink && nameInputRef.current) {
      nameInputRef.current.value = nameFromLink;
    }
  }, []);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-lavender/40 p-8 text-center">
        <p className="font-display text-lg uppercase tracking-wide text-gold-dark">
          Thank you for your RSVP!
        </p>
        <p className="mt-2 font-script text-lg italic text-foreground/85">
          We look forward to celebrating with you.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          ref={nameInputRef}
          id="name"
          name="name"
          type="text"
          required
          placeholder="Full name"
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Attending?</legend>
        <div className="mt-2 flex gap-2">
          <label
            className={`cursor-pointer rounded-full border px-4 py-1.5 font-script text-base transition ${
              attending === "yes"
                ? "border-gold-dark bg-gold-dark text-white"
                : "border-gold/40 text-foreground/80 hover:border-gold-dark"
            }`}
          >
            <input
              type="radio"
              name="attending"
              value="yes"
              required
              checked={attending === "yes"}
              onChange={() => setAttending("yes")}
              className="sr-only"
            />
            Yes
          </label>
          <label
            className={`cursor-pointer rounded-full border px-4 py-1.5 font-script text-base transition ${
              attending === "no"
                ? "border-gold-dark bg-gold-dark text-white"
                : "border-gold/40 text-foreground/80 hover:border-gold-dark"
            }`}
          >
            <input
              type="radio"
              name="attending"
              value="no"
              checked={attending === "no"}
              onChange={() => {
                setAttending("no");
                setGuestCount(0);
              }}
              className="sr-only"
            />
            No
          </label>
        </div>
      </fieldset>

      {attending === "yes" && (
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Plus ones</label>
            <button
              type="button"
              onClick={() => setGuestCount((c) => c + 1)}
              className="font-script text-base text-gold-dark hover:text-gold"
            >
              + Add guest
            </button>
          </div>
          <div className="mt-1 space-y-1">
            {Array.from({ length: guestCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  name="guestName"
                  placeholder={`Guest ${index + 1} name`}
                  className={inputClass + " mt-0"}
                />
                <button
                  type="button"
                  onClick={() => setGuestCount((c) => Math.max(0, c - 1))}
                  className="text-foreground/50 hover:text-foreground/80"
                  aria-label="Remove guest"
                >
                  ✕
                </button>
              </div>
            ))}
            {guestCount === 0 && (
              <p className="pt-1 font-script text-sm italic text-foreground/60">
                Coming with someone? Click &ldquo;Add guest&rdquo; to include their name.
              </p>
            )}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-sm font-medium text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit RSVP"}
      </button>
    </form>
  );
}
