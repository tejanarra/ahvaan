"use client";

import { useState } from "react";
import { createInvite } from "./actions";

export function ShareInviteButton() {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOpen(false);
    setGuestName("");
    setLink("");
    setCopied(false);
    setError("");
  };

  const handleGenerate = async () => {
    if (!guestName.trim()) {
      setError("Enter a guest name first.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const inviteId = await createInvite(guestName);
      const url = new URL(window.location.origin);
      url.searchParams.set("invite", inviteId);
      setLink(url.toString());
    } catch {
      setError("Couldn't create the invite. Try again.");
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied/unsupported — the link is already visible and
      // selectable in the field above, so just point that out instead of
      // failing silently.
      setCopyFailed(true);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "Swathi & Sai Teja's Wedding",
        text: "You're invited! Please RSVP here:",
        url: link,
      });
    } catch {
      // Cancelled — no-op.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gold-dark px-4 py-2 font-display text-xs uppercase tracking-wider text-white shadow-sm transition hover:bg-[#5c3a0c]"
      >
        Share invite link
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={reset}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-gold/30 bg-white/95 p-6 shadow-xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={reset}
              aria-label="Close"
              className="absolute right-4 top-4 text-foreground/50 hover:text-foreground/90"
            >
              ✕
            </button>

            <h2 className="font-display text-lg uppercase tracking-[0.1em] text-gold-dark">
              Share Invite
            </h2>
            <p className="mt-1 font-script text-base italic text-foreground/75">
              Enter the guest&rsquo;s name to generate their personal invite
              link. Only this link will let them RSVP.
            </p>

            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
              disabled={Boolean(link)}
              className="mt-4 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 font-script text-lg text-foreground placeholder:font-sans placeholder:text-sm placeholder:text-foreground/45 focus:border-gold-dark focus:outline-none disabled:opacity-60"
            />

            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

            {!link ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={pending}
                className="mt-4 w-full rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
              >
                {pending ? "Creating invite..." : "Generate Link"}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-lavender/20 px-3 py-2">
                  <input
                    type="text"
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full truncate bg-transparent text-sm text-foreground/80 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-md bg-gold-dark px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#5c3a0c]"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {copyFailed && (
                  <p className="text-xs text-foreground/60">
                    Couldn&rsquo;t copy automatically — tap the link above to select
                    it manually.
                  </p>
                )}

                {typeof navigator !== "undefined" &&
                  typeof navigator.share === "function" && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full rounded-lg border border-gold/40 px-4 py-2 font-display text-sm uppercase tracking-widest text-gold-dark transition hover:border-gold-dark"
                    >
                      Share via...
                    </button>
                  )}

                <button
                  type="button"
                  onClick={reset}
                  className="w-full text-center text-xs text-foreground/50 hover:text-foreground/80"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
