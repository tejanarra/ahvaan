import { useId, type CSSProperties } from "react";

// The ahvaan mark: a reply card tilted −8° carrying a wax-seal dot — see
// docs/09-brand-and-favicon.md for the geometry/color spec. Filled (not
// outlined) to match the static favicon/mark-black.svg recipe everywhere
// the mark appears — the card fill tracks `currentColor` so it still
// adapts to light/dark/guest-theme contexts, only the dot stays fixed
// brand green (not the UI --accent token) so the wax seal reads
// identically across the Studio, marketing pages, and any guest theme.
// `useId` (not a plain incrementing counter) gives each instance a mask id
// that's stable and identical between the server-rendered and hydrated
// client markup — a counter would drift between the two and multiple
// marks on one page (e.g. header + footer) would otherwise collide over a
// shared `<mask id="m">`.
export function BrandMark({ className }: { className?: string }) {
  const maskId = `brand-mark-dot-cutout-${useId()}`;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      // A full replacement, not `cn("h-5 w-5", className)`: this project's
      // `cn()` is a plain concatenator with no tailwind-merge-style
      // de-duplication, so a caller-supplied size (e.g. `markClassName="h-4
      // w-4"`) landing in the same class list as the default `h-5 w-5`
      // leaves both classes present — whichever Tailwind happens to emit
      // later in its generated stylesheet wins, not whichever appears
      // later in this string, so the override could silently fail to
      // apply. Every caller already passes a complete size spec here, so a
      // full-replace fallback is correct, not just simpler.
      className={className ?? "h-5 w-5"}
    >
      <defs>
        <mask id={maskId} maskContentUnits="userSpaceOnUse">
          <rect x="-4" y="-4" width="32" height="32" fill="#fff" />
          <circle cx="18.6" cy="16.6" r="3.6" fill="#000" />
        </mask>
      </defs>
      <g transform="rotate(-8 12 12)">
        <rect x="4.5" y="6.5" width="15" height="11" rx="2.5" fill="currentColor" mask={`url(#${maskId})`} />
        <circle cx="18.6" cy="16.6" r="2.4" fill="#2F5D46" />
      </g>
    </svg>
  );
}

const wordmarkStyle: CSSProperties = {
  letterSpacing: "-0.02em",
  fontVariationSettings: '"WONK" 1, "SOFT" 50',
};

export function BrandLockup({
  className,
  markClassName,
  textClassName,
  markSrc,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  markSrc?: string;
}) {
  // Every prop below is a full-replacement override (see BrandMark's own
  // comment on why `??`, not `cn(default, override)`) — callers pass a
  // complete class spec for the slot they're customizing, not a partial
  // diff against the default.
  return (
    <span className={className ?? "inline-flex items-center gap-2 text-foreground"}>
      {markSrc ? (
        <img src={markSrc} alt="" className={markClassName ?? "h-5 w-5"} />
      ) : (
        <BrandMark className={markClassName} />
      )}
      <span style={wordmarkStyle} className={textClassName ?? "text-lg font-semibold leading-none font-display"}>
        ahvaan
      </span>
    </span>
  );
}
