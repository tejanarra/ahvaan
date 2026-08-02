"use client";

import { useEffect, useState } from "react";

// Shared by ShareIconButton (copy-share-icons.tsx) and ShareInviteButton
// (share-invite-button.tsx), which previously each hand-rolled an
// identical navigator.share try/catch-noop wrapper, plus (ShareIconButton
// only) the post-mount availability check (docs-audit "Low: misc").
export function useNativeShare() {
  // Checked only after mount so the server and initial client render
  // always agree (both render nothing / report unavailable) — checking
  // navigator.share directly during render would mismatch server vs.
  // client and trigger a hydration error.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must run only post-mount, see comment above
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function share(data: ShareData) {
    try {
      await navigator.share(data);
    } catch {
      // Cancelled — no-op.
    }
  }

  return { canShare, share };
}
