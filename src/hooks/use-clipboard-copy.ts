"use client";

import { useState } from "react";

// Shared by CopyIconButton (copy-share-icons.tsx) and ShareInviteButton
// (share-invite-button.tsx), which previously each hand-rolled an
// identical navigator.clipboard.writeText + try/catch-fallback + "copied"
// timeout state machine (docs-audit "Low: misc" — one of the concrete
// instances of docs/bugs.md's "components should share a base" complaint).
// UI on failure differs per caller (an inline editable field vs. explanatory
// text), so this only owns the copy attempt + transient state, not the
// fallback rendering.
export function useClipboardCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch {
      // Clipboard access denied/unsupported — caller decides how to
      // surface this (an editable fallback field, explanatory text, etc.).
      setCopyFailed(true);
    }
  }

  return { copied, copyFailed, copy };
}
