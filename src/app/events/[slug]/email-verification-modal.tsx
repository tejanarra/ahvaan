"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestGuestVerificationAction, verifyGuestVerificationAction } from "./actions";
import { OtpCodeEntry } from "./otp-code-entry";

const inputClass =
  "mt-1.5 w-full rounded-md border border-[var(--t-accent)]/30 bg-transparent px-3 py-2 text-sm text-[var(--t-fg)] placeholder:text-[var(--t-fg)]/45 focus:border-[var(--t-accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]/20";

// The page-level "verify your email once for this event" modal — opened by
// clicking anywhere on a locked RSVP/Forms form (rsvp-form.tsx/
// custom-form.tsx render their fields visibly but disabled until
// verified, rather than hiding them behind this outright). If a page
// embeds both an RSVP block and a Forms block, both independently mount
// this exact component — harmless, same props/result each place — and
// once verified, both unlock together (via router.refresh(), which
// re-runs page.tsx and picks up the now-set guest-session cookie).
export function EmailVerificationModal({
  eventId,
  open,
  onClose,
}: {
  eventId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "error" | "verifying">("idle");
  const [message, setMessage] = useState("");

  const handleRequestCode = async () => {
    setStatus("requesting");
    setMessage("");
    const result = await requestGuestVerificationAction(eventId, email);
    if (result.status === "verification_sent") {
      setVerificationId(result.verificationId);
      setStatus("idle");
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  const handleVerify = async (code: string) => {
    if (!verificationId) return;
    setStatus("verifying");
    setMessage("");
    const result = await verifyGuestVerificationAction(eventId, verificationId, code);
    if (result.status === "success") {
      router.refresh();
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  // A different tab (e.g. the magic link opened in a new tab) finished
  // this same verification — see verification-broadcaster.tsx. Refreshing
  // re-runs page.tsx, which now reads the cookie that tab just set.
  useEffect(() => {
    if (!verificationId || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`verify-${verificationId}`);
    channel.onmessage = () => router.refresh();
    return () => channel.close();
  }, [verificationId, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-lg border border-[var(--t-accent)]/25 bg-[var(--t-surface)] p-5 text-[var(--t-fg)] shadow-lg sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">Verify your email</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center text-[var(--t-fg)]/60 hover:text-[var(--t-fg)]"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--t-fg)]/75">
          This page requires verifying your email before you can respond. It only takes a moment.
        </p>

        <div className="mt-4">
          {verificationId ? (
            <OtpCodeEntry
              email={email}
              pending={status === "verifying"}
              error={status === "error" ? message : null}
              onVerify={handleVerify}
              onCancel={() => {
                setVerificationId(null);
                setStatus("idle");
                setMessage("");
              }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass + " mt-0 min-w-0 flex-1"}
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={status === "requesting" || !email}
                  className="shrink-0 rounded-md bg-[var(--t-accent-dark)] px-4 py-2 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition disabled:opacity-50"
                >
                  {status === "requesting" ? "Sending…" : "Verify"}
                </button>
              </div>
              {status === "error" && <p className="mt-2 text-xs text-red-600">{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
