"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders `children` inside a real, isolated <iframe> viewport instead of a
// plain `max-width`-capped div. The difference matters specifically for
// per-device (mobile/tablet) layout overrides: those are real `@media` CSS
// (see lib/blocks/layout-controls.tsx's blockResponsiveCss), which can only
// ever evaluate against an actual viewport width. A div just *looks* the
// right size while still being laid out inside the dashboard's own (usually
// much wider) browser window, so those rules never fired correctly in
// Preview mode — e.g. a block hidden on tablet stayed visible there no
// matter which device was selected. An iframe is a genuinely separate
// viewport sized to `width`, so the same `@media` rules the real guest page
// relies on evaluate correctly here too.
//
// The parent document's stylesheets are cloned into the iframe's own
// <head> (same-origin, already-compiled CSS this page loaded — nothing is
// re-fetched) since the iframe starts as a blank document with none of its
// own. Height tracks the rendered content via ResizeObserver so the iframe
// never clips or leaves dead space.
export function PreviewFrame({ width, children }: { width: number; children: ReactNode }) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(400);
  const doc = iframe?.contentDocument ?? null;
  const mountNode = doc?.body ?? null;

  useEffect(() => {
    if (!doc) return;
    doc.head.querySelectorAll("[data-copied-style]").forEach((n) => n.remove());
    document.querySelectorAll('head > link[rel="stylesheet"], head > style').forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-copied-style", "");
      doc.head.appendChild(clone);
    });
    doc.documentElement.style.margin = "0";
    doc.body.style.margin = "0";
    // The iframe's own document must never scroll on its own — the
    // ResizeObserver below keeps the iframe element itself exactly as tall
    // as its content, and the *outer* panel (page-builder.tsx's overflow-
    // auto pane) is meant to be the only scrollbar. Without this, any lag
    // between a content change and the observer catching up left the
    // iframe's document briefly shorter than its content, which gave it a
    // scrollbar of its own — two scrollbars fighting for the same content,
    // most visible on Mobile where the page is tallest relative to width.
    doc.documentElement.style.overflow = "hidden";
    doc.body.style.overflow = "hidden";
  }, [doc]);

  useEffect(() => {
    if (!mountNode) return;
    const ro = new ResizeObserver(() => setHeight(Math.max(mountNode.scrollHeight, 200)));
    ro.observe(mountNode);
    return () => ro.disconnect();
  }, [mountNode]);

  return (
    <iframe
      ref={setIframe}
      title="Guest page preview"
      style={{ width: `${width}px`, height: `${height}px`, border: "none", display: "block", margin: "0 auto" }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
