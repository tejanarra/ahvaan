"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitRsvp, type RsvpFormState } from "./actions";
import { VenueMap } from "./venue-map";

const initialState: RsvpFormState = { status: "idle" };

const labelClass =
  "block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark";

const inputClass =
  "mt-1.5 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 font-script text-lg text-foreground placeholder:font-sans placeholder:text-sm placeholder:text-foreground/45 focus:border-gold-dark focus:outline-none";

type SavedRsvp = {
  name: string;
  attending: "yes" | "no";
  guestNames: string[];
};

type GuestField = { key: number; value: string };

function toGuestFields(names: string[]): GuestField[] {
  return names.map((value, i) => ({ key: i, value }));
}

export function RsvpForm({
  inviteId,
  guestName,
  initialRsvp,
}: {
  inviteId: string;
  guestName: string;
  initialRsvp: { name: string; attending: boolean; additionalGuests: string[] } | null;
}) {
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);

  const [saved, setSaved] = useState<SavedRsvp | null>(
    initialRsvp
      ? {
          name: initialRsvp.name,
          attending: initialRsvp.attending ? "yes" : "no",
          guestNames: initialRsvp.additionalGuests,
        }
      : null
  );
  const [mode, setMode] = useState<"view" | "edit">(initialRsvp ? "view" : "edit");
  const [attending, setAttending] = useState<"yes" | "no" | "">(saved?.attending ?? "");
  const [guestFields, setGuestFields] = useState<GuestField[]>(
    toGuestFields(saved?.guestNames ?? [])
  );
  const nextGuestKey = useRef(guestFields.length);

  useEffect(() => {
    if (state.status === "success" && state.data) {
      setSaved({
        name: state.data.name,
        attending: state.data.attending ? "yes" : "no",
        guestNames: state.data.additionalGuests,
      });
      setMode("view");
    }
  }, [state]);

  const addGuest = () => {
    setGuestFields((fields) => [...fields, { key: nextGuestKey.current++, value: "" }]);
  };

  const removeGuest = (key: number) => {
    setGuestFields((fields) => fields.filter((f) => f.key !== key));
  };

  const updateGuest = (key: number, value: string) => {
    setGuestFields((fields) =>
      fields.map((f) => (f.key === key ? { ...f, value } : f))
    );
  };

  if (mode === "view" && saved) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-gold/30 bg-lavender/40 p-6 text-center">
          <p className="font-display text-lg uppercase tracking-wide text-gold-dark">
            {saved.attending === "yes"
              ? "You're on the list!"
              : "Thanks for letting us know"}
          </p>
          <div className="mt-4 space-y-1.5 font-script text-base text-foreground/90">
            <p>
              <span className="font-display text-xs uppercase tracking-wider text-gold-dark">
                Name:{" "}
              </span>
              {saved.name}
            </p>
            <p>
              <span className="font-display text-xs uppercase tracking-wider text-gold-dark">
                Attending:{" "}
              </span>
              {saved.attending === "yes" ? "Yes" : "No"}
            </p>
            {saved.attending === "yes" && saved.guestNames.length > 0 && (
              <p>
                <span className="font-display text-xs uppercase tracking-wider text-gold-dark">
                  Plus ones:{" "}
                </span>
                {saved.guestNames.join(", ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setAttending(saved.attending);
              setGuestFields(toGuestFields(saved.guestNames));
              nextGuestKey.current = saved.guestNames.length;
              setMode("edit");
            }}
            className="mt-4 rounded-full border border-gold/40 px-5 py-1.5 font-script text-base text-gold-dark transition hover:border-gold-dark"
          >
            Edit RSVP
          </button>
        </div>

        <VenueMap />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="inviteId" value={inviteId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={saved?.name ?? guestName}
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
                  setGuestFields([]);
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
                    name="guestName"
                    value={field.value}
                    onChange={(e) => updateGuest(field.key, e.target.value)}
                    placeholder={`Guest ${index + 1} name`}
                    className={inputClass + " mt-0"}
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
                  Coming with someone? Click &ldquo;Add guest&rdquo; to include their name.
                </p>
              )}
            </div>
          </div>
        )}

        {state.status === "error" && (
          <p className="text-sm font-medium text-red-600">{state.message}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit RSVP"}
          </button>
          {saved && (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-lg border border-gold/40 px-4 py-2.5 font-display text-sm uppercase tracking-widest text-gold-dark transition hover:border-gold-dark"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {saved && <VenueMap />}
    </div>
  );
}
