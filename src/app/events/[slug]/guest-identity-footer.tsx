"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearGuestVerificationAction } from "./actions";

// Shown once, page-wide (page.tsx), for a no-invite guest who's passed the
// email verification gate — not per RSVP/Forms block, since one
// verification now covers every form on the page (see
// email-verification-modal.tsx). Lets them end that session (e.g. they
// verified under the wrong address, or a shared device is about to be
// handed to someone else) — clearing the cookie and refreshing brings the
// gate back so they can verify under a different email.
export function GuestIdentityFooter({ eventId, email }: { eventId: string; email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <p className="pb-6 text-center text-xs text-[var(--t-fg)]/60">
        Verify again with a different email?{" "}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await clearGuestVerificationAction(eventId);
              router.refresh();
            })
          }
          className="underline underline-offset-2 hover:text-[var(--t-fg)] disabled:opacity-50"
        >
          {isPending ? "Clearing…" : "Yes, change it"}
        </button>{" "}
        ·{" "}
        <button type="button" onClick={() => setConfirming(false)} className="underline underline-offset-2 hover:text-[var(--t-fg)]">
          Cancel
        </button>
      </p>
    );
  }

  return (
    <p className="pb-6 text-center text-xs text-[var(--t-fg)]/60">
      Submitted as <span className="text-[var(--t-fg)]/80">{email}</span> —{" "}
      <button type="button" onClick={() => setConfirming(true)} className="underline underline-offset-2 hover:text-[var(--t-fg)]">
        Change?
      </button>
    </p>
  );
}
