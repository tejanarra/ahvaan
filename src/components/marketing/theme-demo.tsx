"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { THEMES, getTheme } from "@/lib/themes";
import { cn } from "@/lib/cn";

// The hero's proof-of-product: a miniature invite page rendered from real
// theme tokens (same --t-* mechanism the guest page uses), re-themed
// instantly by the swatch dots below it. Content is static/sample —
// pointer-events are disabled inside the frame.
export function ThemeDemo() {
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const theme = getTheme(themeId);
  const c = theme.colors;

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div
        className="pointer-events-none select-none overflow-hidden rounded-[2rem] border border-border-strong shadow-[0_12px_40px_rgb(33_30_25/0.16)] transition-colors duration-300"
        style={{ background: c.background, color: c.foreground } as CSSProperties}
        aria-hidden="true"
      >
        <div className="px-7 pb-8 pt-10 text-center">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: c.accent }}
          >
            Wedding
          </p>
          <p className="mt-3 font-display text-3xl leading-tight">Maya &amp; Julien</p>
          <p className="mt-2 text-xs opacity-80">
            Saturday, June 12 · The Orchard House, Sonoma
          </p>

          <div
            className="mx-auto mt-5 h-px w-16"
            style={{ background: c.accent, opacity: 0.5 }}
          />

          <div className="mt-5 flex items-end justify-center gap-4">
            {[
              ["48", "days"],
              ["06", "hours"],
              ["21", "mins"],
            ].map(([n, label]) => (
              <div key={label}>
                <p className="font-display text-xl tabular-nums">{n}</p>
                <p className="text-[9px] uppercase tracking-[0.14em] opacity-70">{label}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-6 rounded-2xl p-5 text-left"
            style={{ background: c.surface }}
          >
            <p className="text-sm font-semibold">Will you be joining us?</p>
            <div
              className="mt-3 rounded-lg border px-3 py-2 text-xs opacity-80"
              style={{ borderColor: c.accent + "55" }}
            >
              Amara Osei
            </div>
            <div className="mt-3 flex gap-2">
              <span
                className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold"
                style={{ background: c.accent, color: c.background }}
              >
                Joyfully accept
              </span>
              <span
                className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium opacity-80"
                style={{ borderColor: c.accentDark }}
              >
                Decline
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3" role="group" aria-label="Preview theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setThemeId(t.id)}
            aria-label={`Preview the ${t.label} theme`}
            aria-pressed={t.id === themeId}
            className={cn(
              "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
              t.id === themeId ? "border-foreground" : "border-transparent"
            )}
            style={{
              background: `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.accentDark})`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted">{theme.label} — one of your free themes</p>
    </div>
  );
}
