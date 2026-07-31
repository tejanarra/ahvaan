"use client";

import { useEffect, useRef, useState } from "react";
import type { CountdownConfig } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const countdownDefaultConfig: CountdownConfig = { label: "Counting down to" };

// The universal block Width control (S/M/L/Full, every block type) is the
// only size control this block has. Digit/unit font sizes are derived from
// the block's actual rendered width (via ResizeObserver, below) rather than
// CSS container queries: this block can land inside ancestor wrappers whose
// own width is computed by shrink-to-fit (e.g. an unstyled flex-column
// wrapper), and `container-type` imposes size containment that makes such a
// wrapper treat this box as zero-width when computing that shrink-to-fit
// size — collapsing the whole block. Measuring in JS sidesteps that.
function digitFontPx(width: number) {
  return Math.min(48, Math.max(20, width * 0.09));
}
function unitFontPx(width: number) {
  return Math.min(12, Math.max(9, width * 0.022));
}

export function CountdownEdit({
  config,
  onChange,
}: {
  config: CountdownConfig;
  onChange: (next: CountdownConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Label" hint="Counts down to this event's date/time, set on the Cover/hero block.">
        <Input
          type="text"
          value={config.label ?? ""}
          onChange={(e) => onChange({ ...config, label: e.target.value })}
          placeholder="e.g. Counting down to"
        />
      </Field>
    </div>
  );
}

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!targetIso || now === null) return null;
  const target = new Date(targetIso).getTime();
  // A malformed event_date (only reachable via hand-edited JSON, since the
  // date picker always produces a valid one) would otherwise silently render
  // "NaN" in every unit below instead of just hiding the countdown.
  if (Number.isNaN(target)) return null;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff / (60 * 60 * 1000)) % 24);
  const minutes = Math.floor((diff / (60 * 1000)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function CountdownRender({
  config,
  ctx,
}: {
  config: CountdownConfig;
  ctx: PageRenderContext;
}) {
  const { event } = ctx;
  const targetIso = event.event_date
    ? `${event.event_date}T${event.event_time ? toIsoTime(event.event_time) : "00:00:00"}`
    : null;
  const remaining = useCountdown(targetIso);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!targetIso) return null;

  return (
    <div ref={wrapperRef} className="w-full">
      {config.label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">{config.label}</p>
      )}
      {remaining ? (
        <div className="mt-2 flex w-full justify-center gap-4 text-[var(--t-fg)]">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div key={unit} className="text-center">
              <p
                className="tabular-nums"
                style={{ fontFamily: "var(--t-font-display)", fontSize: `${digitFontPx(width)}px` }}
              >
                {remaining[unit]}
              </p>
              <p
                className="uppercase tracking-wide text-[var(--t-fg)]/60"
                style={{ fontSize: `${unitFontPx(width)}px` }}
              >
                {unit}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 h-10" />
      )}
    </div>
  );
}

function toIsoTime(time: string) {
  // event_time is a free-text field like "4:00 PM" — best-effort parse to
  // 24h HH:mm:ss; falls back to midnight if it can't be parsed.
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return "00:00:00";
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}:00`;
}
