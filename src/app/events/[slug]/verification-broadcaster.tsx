"use client";

import { useEffect } from "react";

// Mounted unconditionally on every public event page (not just when the
// verify gate itself renders — by the time this tab's `?verified=<id>` load
// happens, the guest-session cookie is already set, so the gate blocks that
// would normally show it have already flipped to their real content and
// won't mount it). Its only job: tell a *different*, still-open tab that
// originally requested this same verification id (see
// email-verification-modal.tsx's BroadcastChannel listener) that it's done,
// so that tab can `router.refresh()` without the guest manually reloading it.
export function VerificationBroadcaster({ verificationId }: { verificationId: string | null }) {
  useEffect(() => {
    if (!verificationId || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`verify-${verificationId}`);
    channel.postMessage({ done: true });
    channel.close();
  }, [verificationId]);

  return null;
}
