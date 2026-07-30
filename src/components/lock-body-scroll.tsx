"use client";

import { useEffect } from "react";

/**
 * The dashboard shell is a fixed h-screen flex column where `<main>` is the
 * only intended scroll surface (it scrolls internally via overflow-y-auto).
 * Without this, a rare browser quirk let the outer document itself scroll a
 * bit further than the shell's own height on content-heavy pages, revealing
 * blank space below the shell once scrolled. Locking body scroll while this
 * layout is mounted makes `<main>` unambiguously the only scrollable region.
 * Restored on unmount so other routes (guest pages, auth) keep normal
 * document-level scrolling.
 */
export function LockBodyScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return null;
}
