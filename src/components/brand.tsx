import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// The Gatherie mark: a reply card tilted −8° carrying a wax-seal dot — see
// docs/09-brand-and-favicon.md for the geometry/color spec. The dot is always
// brand green (not the UI --accent token) so the mark stays identical across
// the Studio, marketing pages, and any guest theme it ever appears on.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-5 w-5", className)}>
      <g transform="rotate(-8 12 12)">
        <rect
          x="4.5"
          y="6.5"
          width="15"
          height="11"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="18.6" cy="16.6" r="2.4" fill="#2F5D46" />
      </g>
    </svg>
  );
}

const wordmarkStyle: CSSProperties = {
  fontFamily: "var(--font-fraunces), Georgia, serif",
  letterSpacing: "-0.02em",
  fontVariationSettings: '"WONK" 1, "SOFT" 50',
};

export function BrandLockup({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <BrandMark className={markClassName} />
      <span
        style={wordmarkStyle}
        className={cn("text-lg font-semibold lowercase leading-none", textClassName)}
      >
        gatherie
      </span>
    </span>
  );
}
