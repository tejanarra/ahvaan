"use client";

import { useState } from "react";

export function CopyInviteLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = new URL(window.location.origin);
    url.searchParams.set("invite", id);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
