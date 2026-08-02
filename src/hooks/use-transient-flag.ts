"use client";

import { useRef, useState } from "react";

// The "swap an icon/label to reflect a result, then revert after N ms"
// state machine, shared by CopyIconButton (via useClipboardCopy) and
// SendInviteEmailButton — previously each reimplemented their own
// `useState` + `setTimeout` pair for this (docs-audit "Low: misc", one of
// the concrete instances of docs/bugs.md's "components should share a
// base" complaint). Only owns the flag + its auto-reset; callers still own
// what triggers it and what it renders.
export function useTransientFlag(resetMs = 2000) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function trigger() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActive(true);
    timeoutRef.current = setTimeout(() => setActive(false), resetMs);
  }

  return [active, trigger] as const;
}
