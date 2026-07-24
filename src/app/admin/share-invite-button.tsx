"use client";

import { useState } from "react";
import { createInvite } from "./actions";

export function ShareInviteButton() {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleShare = async () => {
    if (!guestName.trim()) {
      setError("Enter a guest name first.");
      return;
    }

    setPending(true);
    setError("");

    let inviteId: string;
    try {
      inviteId = await createInvite(guestName);
    } catch {
      setPending(false);
      setError("Couldn't create the invite. Try again.");
      return;
    }

    const url = new URL(window.location.origin);
    url.searchParams.set("invite", inviteId);
    const link = url.toString();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Swathi & Sai Teja's Wedding",
          text: "You're invited! Please RSVP here:",
          url: link,
        });
        setPending(false);
        setOpen(false);
        return;
      } catch {
        // Share was cancelled or unsupported mid-flow — fall back to copy.
      }
    }

    await navigator.clipboard.writeText(link);
    setPending(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        Share invite link
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold text-gray-900">Share Invite</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter the guest&rsquo;s name to generate their personal invite
              link. Only this link will let them RSVP — anyone else just sees
              the invitation.
            </p>

            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleShare}
              disabled={pending}
              className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {pending
                ? "Creating invite..."
                : copied
                  ? "Link copied!"
                  : "Generate & Share Link"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
