"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Fade/rise-once on scroll — the only scroll effect the marketing page is
// allowed (docs/06-home-page.md). Content is fully visible by default
// (SSR, no-JS, reduced-motion, in-viewport-on-load all see it); only
// elements measured to be below the fold after mount get hidden and then
// revealed when scrolled into view.
type Phase = "static" | "hidden" | "shown";

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.9) return;

    setPhase("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        phase !== "static" && "transition-[opacity,transform] duration-500 ease-out",
        phase === "hidden" && "opacity-0 translate-y-2",
        phase === "shown" && "opacity-100 translate-y-0",
        className
      )}
    >
      {children}
    </div>
  );
}
