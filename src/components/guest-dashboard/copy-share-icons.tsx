"use client";

import { useEffect, useState } from "react";
import { CopyIcon, ShareIcon, CheckIcon } from "@/components/icons";
import { buildInviteLink, buildInviteMessage } from "./invite-link";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";

export function CopyIconButton({
  eventSlug,
  eventTitle,
  inviteId,
}: {
  eventSlug: string;
  eventTitle: string;
  inviteId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const handleCopy = async () => {
    const link = buildInviteLink(eventSlug, inviteId);
    const message = buildInviteMessage(eventTitle, link);
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
      <Input
        type="text"
        readOnly
        value={fallbackLink}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setFallbackLink(null)}
        className="h-8 max-w-56 min-w-0 text-xs"
      />
    );
  }

  return (
    <IconButton
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy invite message"}
      title={copied ? "Copied" : "Copy invite message"}
      className={copied ? "text-success" : undefined}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </IconButton>
  );
}

export function ShareIconButton({
  eventSlug,
  eventTitle,
  inviteId,
  guestName,
}: {
  eventSlug: string;
  eventTitle: string;
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
    const link = buildInviteLink(eventSlug, inviteId);
    try {
      await navigator.share({
        title: eventTitle,
        text: `You're invited${guestName ? `, ${guestName}` : ""}! Please RSVP here:`,
        url: link,
      });
    } catch {
      // Cancelled — no-op.
    }
  };

  return (
    <IconButton onClick={handleShare} aria-label="Share invite" title="Share invite">
      <ShareIcon />
    </IconButton>
  );
}
