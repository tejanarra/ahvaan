"use client";

import { useEffect, useState } from "react";
import { CopyIcon, ShareIcon, CheckIcon } from "./icons";
import { buildInviteLink, buildInviteMessage } from "./invite-link";

export function CopyIconButton({ inviteId }: { inviteId: string }) {
  const [copied, setCopied] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const handleCopy = async () => {
    const link = buildInviteLink(inviteId);
    const message = buildInviteMessage(link);
    try {
      await navigator.clipboard.writeText(message);
      setFallbackLink(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied/unsupported — fall back to a manually
      // selectable field with the same message+link text.
      setFallbackLink(message);
    }
  };

  if (fallbackLink) {
    return (
      <input
        type="text"
        readOnly
        value={fallbackLink}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setFallbackLink(null)}
        className="w-full min-w-0 max-w-56 rounded-md border border-gold/30 bg-lavender/20 px-2 py-1 text-base text-foreground/80 focus:outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy invite message"}
      title={copied ? "Copied" : "Copy invite message"}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
        copied ? "text-green-600" : "text-gold-dark hover:bg-lavender/40"
      }`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

export function ShareIconButton({
  inviteId,
  guestName,
}: {
  inviteId: string;
  guestName: string;
}) {
  // Checked only after mount so the server and initial client render always
  // agree (both render nothing) — checking navigator.share directly during
  // render would mismatch server vs. client and trigger a hydration error.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  if (!canShare) return null;

  const handleShare = async () => {
    const link = buildInviteLink(inviteId);
    try {
      await navigator.share({
        title: "Swathi & Sai Teja's Wedding",
        text: `You're invited${guestName ? `, ${guestName}` : ""}! Please RSVP here:`,
        url: link,
      });
    } catch {
      // Cancelled — no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share invite"
      title="Share invite"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gold-dark transition hover:bg-lavender/40"
    >
      <ShareIcon />
    </button>
  );
}
