"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared behavior for `SectionNav`'s horizontally-scrollable pill strip on
 * narrow viewports: detects whether the strip actually overflows (so an
 * edge-fade mask only appears when there's something to scroll to) and
 * keeps the active item in view across route changes.
 *
 * Font swap (next/font `display: swap`) changes label widths after first
 * paint, which is the classic cause of a stale overflow/indicator
 * measurement — `document.fonts.ready` re-triggers the ResizeObserver's
 * work once the real font has taken over from the fallback.
 */
export function useScrollStrip<T extends HTMLElement>(activeKey: string) {
  const trackRef = useRef<T | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => setOverflowing(track.scrollWidth > track.clientWidth + 1);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeRef.current?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  return { trackRef, activeRef, overflowing };
}
