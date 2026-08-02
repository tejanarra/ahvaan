"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { getTheme } from "@/lib/themes";

// docs/05 wants the vignette rotating among 3 themes per load. Picking with
// Math.random() during the initial render would differ between the SSR
// pass and client hydration (a real hydration mismatch, not just a lint
// nit) — so the first render always uses the same theme, and a `useEffect`
// swaps in the random pick right after mount instead. The vignette is
// purely decorative (`aria-hidden`), so a swap a moment after paint is an
// acceptable trade for correctness.
const VIGNETTE_THEME_IDS = ["classic-gold", "midnight-elegant", "ink-and-blush"] as const;

// Split-screen auth (docs/05): left pane is a Stage vignette — a miniature
// themed invite on its theme's own background — right pane is the form on
// Studio paper. The vignette pane disappears below lg; mobile gets a clean
// single-column card.
function StageVignette() {
  const [themeId, setThemeId] = useState<(typeof VIGNETTE_THEME_IDS)[number]>(VIGNETTE_THEME_IDS[0]);
  useEffect(() => {
    // Intentional post-mount-only randomization — see the comment above
    // VIGNETTE_THEME_IDS for why this can't just be a lazy useState
    // initializer (that would run during SSR too and mismatch on hydrate).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeId(VIGNETTE_THEME_IDS[Math.floor(Math.random() * VIGNETTE_THEME_IDS.length)]);
  }, []);
  const c = getTheme(themeId).colors;
  return (
    <div
      className="relative hidden flex-col items-center justify-center overflow-hidden lg:flex"
      style={{ background: c.background }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none w-72 select-none rounded-2xl px-8 pb-8 pt-10 text-center shadow-[0_12px_40px_rgb(0_0_0/0.35)]"
        style={{ background: c.surface, color: c.foreground }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: c.accent }}>
          Wedding
        </p>
        <p className="mt-3 text-3xl leading-tight font-display">
          Maya &amp; Julien
        </p>
        <p className="mt-2 text-xs opacity-80">Saturday, June 12</p>
        <div className="mx-auto mt-5 h-px w-14" style={{ background: c.accent, opacity: 0.6 }} />
        <p className="mt-5 text-xs italic opacity-80 font-display">
          “Joyfully accept”
        </p>
        <div
          className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: c.accent, color: c.background }}
        >
          RSVP
        </div>
      </div>
      <p className="mt-8 max-w-xs text-center text-sm" style={{ color: c.accent }}>
        Every event gets a page this lovely — yours to design.
      </p>
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[45fr_55fr]">
      <StageVignette />
      <div className="flex items-start justify-center px-4 py-10 sm:items-center sm:px-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex" aria-label="ahvaan home">
            <BrandLockup />
          </Link>
          <h1 className="mt-8 text-3xl text-foreground font-display">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8 space-y-4">{children}</div>
          {footer && <p className="mt-8 text-sm text-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
