"use client";

import { useState } from "react";

export function CopyInviteLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const buildLink = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set("invite", id);
    return url.toString();
  };

  const handleCopy = async () => {
    const link = buildLink();
    try {
      await navigator.clipboard.writeText(link);
      setFallbackLink(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied/unsupported — fall back to a manually
      // selectable field instead of silently doing nothing.
      setFallbackLink(link);
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
        className="w-56 rounded-md border border-gold/30 bg-lavender/20 px-2 py-1 text-xs text-foreground/80 focus:outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-gold/30 px-2.5 py-1 text-xs font-medium text-foreground/70 transition hover:bg-lavender/30"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
