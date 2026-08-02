"use client";

import { useEffect } from "react";

// Registered once, app-wide — see public/sw.js for what it actually does
// (network-first, with a bare offline "/" fallback for page navigations
// only; nothing else is ever cached).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
