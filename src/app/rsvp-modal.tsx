"use client";

import { useEffect, useState } from "react";
import { RsvpForm } from "./rsvp-form";

export function RsvpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto block rounded-full bg-gold-dark px-10 py-3 font-display text-sm uppercase tracking-[0.2em] text-white shadow-[0_8px_30px_-10px_rgba(138,98,21,0.5)] transition hover:bg-[#5c3a0c]"
      >
        RSVP
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-white/60 bg-white/95 p-6 shadow-xl backdrop-blur-md sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-foreground/50 hover:text-foreground/90"
            >
              ✕
            </button>

            <h2 className="text-center font-display text-2xl uppercase tracking-[0.15em] text-gold-dark">
              Kindly RSVP
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center font-script text-lg italic text-foreground/85">
              Please let us know who&rsquo;s coming from your side &mdash; you
              and anyone joining you &mdash; so we can plan seating and
              catering accordingly.
            </p>
            <div className="mt-4">
              <RsvpForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
