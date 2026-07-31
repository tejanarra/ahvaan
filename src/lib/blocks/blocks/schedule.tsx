"use client";

import { useEffect, useRef, useState } from "react";
import type { ScheduleAlign, ScheduleConfig, ScheduleDirection, ScheduleItem, ScheduleStyle } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { ConfirmIconButton } from "@/components/confirm-icon-button";

export const scheduleDefaultConfig: ScheduleConfig = {
  heading: "Schedule",
  items: [],
  style: "cards",
  direction: "vertical",
  align: "left",
  gapPx: 28,
};

const STYLE_OPTIONS: { value: ScheduleStyle; label: string }[] = [
  { value: "timeline", label: "Timeline" },
  { value: "cards", label: "Cards" },
  { value: "minimal", label: "Minimal" },
];

const DIRECTION_OPTIONS: { value: ScheduleDirection; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

const ALIGN_OPTIONS: { value: ScheduleAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
];

export function ScheduleEdit({
  config,
  onChange,
}: {
  config: ScheduleConfig;
  onChange: (next: ScheduleConfig) => void;
}) {
  const items = config.items ?? [];
  const style = config.style ?? "cards";

  const addItem = () =>
    onChange({ ...config, items: [...items, { id: crypto.randomUUID(), time: "", label: "", description: "" }] });
  const removeItem = (index: number) => onChange({ ...config, items: items.filter((_, i) => i !== index) });
  const updateItem = (index: number, patch: Partial<ScheduleItem>) =>
    onChange({ ...config, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...config, items: next });
  };

  return (
    <div className="space-y-5">
      <Field label="Heading" hint="Optional — leave blank to hide.">
        <Input
          value={config.heading ?? ""}
          onChange={(e) => onChange({ ...config, heading: e.target.value })}
          placeholder="e.g. Schedule"
        />
      </Field>

      <Field label="Layout style">
        <ToggleGroup size="md" options={STYLE_OPTIONS} value={style} onChange={(v) => onChange({ ...config, style: v as ScheduleStyle })} />
      </Field>

      <Field
        label="Direction"
        hint={
          style === "timeline"
            ? "Vertical: items alternate left/right of a centered line. Horizontal: items alternate above/below."
            : "Horizontal scrolls as a row — useful for a long schedule in a narrow block."
        }
      >
        <ToggleGroup
          size="md"
          options={DIRECTION_OPTIONS}
          value={config.direction ?? "vertical"}
          onChange={(v) => onChange({ ...config, direction: v as ScheduleDirection })}
        />
      </Field>

      {style !== "timeline" && (
        <Field label="Text alignment">
          <ToggleGroup
            size="md"
            options={ALIGN_OPTIONS}
            value={config.align ?? "left"}
            onChange={(v) => onChange({ ...config, align: v as ScheduleAlign })}
          />
        </Field>
      )}

      <Field label="Gap between items" hint="Spacing in pixels.">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={4}
            max={120}
            value={config.gapPx ?? 28}
            onChange={(e) => onChange({ ...config, gapPx: Number(e.target.value) || 0 })}
            className="w-24"
          />
          <span className="text-sm text-muted">px</span>
        </div>
      </Field>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Items ({items.length})</p>
        {items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Item {index + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move item up"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Move item down"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
                <ConfirmIconButton
                  label="Remove item"
                  confirmText={`Remove "${item.label || "this item"}"?`}
                  onConfirm={async () => removeItem(index)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Time" hint="Optional">
                <Input
                  value={item.time ?? ""}
                  onChange={(e) => updateItem(index, { time: e.target.value })}
                  placeholder="4:00 PM"
                />
              </Field>
              <Field label="Label">
                <Input value={item.label} onChange={(e) => updateItem(index, { label: e.target.value })} placeholder="Ceremony" />
              </Field>
            </div>
            <Field label="Description" hint="Optional">
              <Textarea
                rows={2}
                value={item.description ?? ""}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
        >
          + Add item
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Custom CSS hooks</p>
        <p className="mt-1.5 text-xs text-muted">
          For finer control, use this block&apos;s own{" "}
          <span className="font-medium text-foreground">Layout → Advanced options → Custom CSS</span> (above, outside
          this panel). These CSS custom properties cascade into every part of this component:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-surface p-2 text-[11px] leading-relaxed text-muted">
{`--schedule-dot-color: #b45309;
--schedule-line-color: #e7dcc8;
--schedule-card-bg: #fdf6e3;
--schedule-card-border: #e7dcc8;
--schedule-radius: 20px;
--schedule-time-color: #92400e;`}
        </pre>
      </div>
    </div>
  );
}

// Shared eyebrow-style heading (centered, small-caps, accent-dark) — the
// same convention rsvp-form.tsx's own config.heading uses, so a page mixing
// both blocks reads as one system rather than each inventing its own
// heading treatment.
function ScheduleHeading({ heading }: { heading: string }) {
  return (
    <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
      {heading}
    </h2>
  );
}

// The dot every timeline variant marks each item with — a CSS custom
// property (--schedule-dot-color) so a host can retheme it without needing
// real per-selector CSS, which this app's sandbox model never allows for
// host-authored styles (see layout-controls.tsx's parseInlineStyle) —  a
// custom property set on this block's own wrapper (via its existing
// Advanced-options Custom CSS field) inherits into every element below it
// for free, so no new styling mechanism is needed to expose this hook.
function Dot() {
  return (
    <div
      className="h-3 w-3 shrink-0 rounded-full"
      style={{ background: "var(--schedule-dot-color, var(--t-accent-dark))" }}
    />
  );
}

function ItemText({
  item,
  align,
  clampDescription,
}: {
  item: ScheduleItem;
  align?: "left" | "right" | "center";
  // Horizontal timeline items sit in a fixed-width column (see
  // TimelineHorizontal) — an unclamped long description there just makes
  // the whole row taller without bound, which is what made it look broken
  // rather than merely "scrolls a bit further."
  clampDescription?: boolean;
}) {
  const textAlign = align ?? "left";
  return (
    <div style={{ textAlign }}>
      {item.time && (
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--schedule-time-color, var(--t-accent-dark))" }}
        >
          {item.time}
        </p>
      )}
      <p className="mt-0.5 text-lg text-[var(--t-fg)]" style={{ fontFamily: "var(--t-font-display)" }}>
        {item.label}
      </p>
      {item.description && (
        <p className={`mt-0.5 text-sm text-[var(--t-fg)]/70 ${clampDescription ? "line-clamp-3" : ""}`}>
          {item.description}
        </p>
      )}
    </div>
  );
}

// Vertical: a centered line with items alternating left/right of it (the
// classic wedding-website timeline). The dot for each item is vertically
// centered against that item's own text (via flex, so it tracks correctly
// regardless of how many lines the description wraps to) — which means a
// dot's distance from the *next* dot varies row to row depending on each
// item's own content height, so a single fixed-length CSS line per row
// can't reach it (it either falls short of a tall item's dot or overshoots
// a short one — the exact "line breaks/doesn't extend properly" bug this
// replaced). Measuring each dot's actual rendered position after mount and
// drawing one absolutely-positioned segment per dot-to-dot gap is the only
// way to keep the line continuous while also keeping dots text-centered.
function TimelineVertical({ items, gapPx }: { items: ScheduleItem[]; gapPx: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [segments, setSegments] = useState<{ top: number; height: number }[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const containerTop = container!.getBoundingClientRect().top;
      const centers = dotRefs.current.map((el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return rect.top + rect.height / 2 - containerTop;
      });
      const next: { top: number; height: number }[] = [];
      for (let i = 0; i < centers.length - 1; i++) {
        const a = centers[i];
        const b = centers[i + 1];
        if (a == null || b == null) continue;
        next.push({ top: a, height: Math.max(0, b - a) });
      }
      setSegments(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items, gapPx]);

  return (
    <div ref={containerRef} className="relative">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="absolute w-px"
          style={{
            left: "calc(50% - 0.5px)",
            top: seg.top,
            height: seg.height,
            background: "var(--schedule-line-color, color-mix(in oklab, var(--t-accent) 35%, transparent))",
          }}
        />
      ))}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isLeft = index % 2 === 0;
        return (
          <div
            key={item.id}
            className="relative grid grid-cols-[1fr_auto_1fr] items-stretch gap-x-4"
            style={{ paddingBottom: isLast ? 0 : gapPx }}
          >
            <div className="flex flex-col justify-center">{isLeft && <ItemText item={item} align="right" />}</div>
            <div className="flex flex-col items-center justify-center">
              <div
                ref={(el) => {
                  dotRefs.current[index] = el;
                }}
              >
                <Dot />
              </div>
            </div>
            <div className="flex flex-col justify-center">{!isLeft && <ItemText item={item} align="left" />}</div>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal "flip": the same alternating idea, rotated 90° — a horizontal
// line with items alternating above/below it, in a horizontally-scrolling
// row (min-width per item rather than JS measurement, so short blocks still
// scroll cleanly instead of squeezing every item unreadably narrow).
function TimelineHorizontal({ items, gapPx }: { items: ScheduleItem[]; gapPx: number }) {
  return (
    <div className="flex items-stretch overflow-x-auto pb-2" style={{ gap: gapPx }}>
      {items.map((item, index) => {
        const isTop = index % 2 === 0;
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="flex w-64 shrink-0 flex-col items-center">
            <div className="flex min-h-24 flex-1 items-end justify-center">
              {isTop && <ItemText item={item} align="center" clampDescription />}
            </div>
            <div className="flex w-full items-center py-1">
              <div
                className="h-px flex-1"
                style={{ background: isFirst ? "transparent" : "var(--schedule-line-color, color-mix(in oklab, var(--t-accent) 35%, transparent))" }}
              />
              <Dot />
              <div
                className="h-px flex-1"
                style={{ background: isLast ? "transparent" : "var(--schedule-line-color, color-mix(in oklab, var(--t-accent) 35%, transparent))" }}
              />
            </div>
            <div className="flex min-h-24 flex-1 items-start justify-center">
              {!isTop && <ItemText item={item} align="center" clampDescription />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ item, align, clampDescription }: { item: ScheduleItem; align: ScheduleAlign; clampDescription?: boolean }) {
  return (
    <div
      className="shrink-0"
      style={{
        borderRadius: "var(--schedule-radius, 12px)",
        border: "1px solid var(--schedule-card-border, color-mix(in oklab, var(--t-fg) 10%, transparent))",
        background: "var(--schedule-card-bg, color-mix(in oklab, var(--t-accent) 14%, var(--t-bg)))",
        padding: "16px",
      }}
    >
      {item.time && (
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
          style={{
            background: "color-mix(in oklab, var(--schedule-time-color, var(--t-accent-dark)) 15%, transparent)",
            color: "var(--schedule-time-color, var(--t-accent-dark))",
          }}
        >
          {item.time}
        </span>
      )}
      <p
        className="mt-2 text-lg text-[var(--t-fg)]"
        style={{ fontFamily: "var(--t-font-display)", textAlign: align }}
      >
        {item.label}
      </p>
      {item.description && (
        <p
          className={`mt-1 text-sm text-[var(--t-fg)]/70 ${clampDescription ? "line-clamp-4" : ""}`}
          style={{ textAlign: align }}
        >
          {item.description}
        </p>
      )}
    </div>
  );
}

function CardsLayout({ items, direction, align, gapPx }: { items: ScheduleItem[]; direction: ScheduleDirection; align: ScheduleAlign; gapPx: number }) {
  if (direction === "horizontal") {
    return (
      <div className="flex overflow-x-auto pb-2" style={{ gap: gapPx }}>
        {items.map((item) => (
          <div key={item.id} className="w-56 shrink-0">
            <Card item={item} align={align} clampDescription />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: gapPx }}>
      {items.map((item) => (
        <Card key={item.id} item={item} align={align} />
      ))}
    </div>
  );
}

function MinimalLayout({ items, direction, align, gapPx }: { items: ScheduleItem[]; direction: ScheduleDirection; align: ScheduleAlign; gapPx: number }) {
  const dividerColor = "var(--schedule-line-color, color-mix(in oklab, var(--t-fg) 10%, transparent))";
  if (direction === "horizontal") {
    return (
      <div className="flex overflow-x-auto pb-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="w-56 shrink-0"
            style={{
              paddingLeft: index === 0 ? 0 : gapPx,
              paddingRight: index === items.length - 1 ? 0 : gapPx,
              borderLeft: index === 0 ? undefined : `1px solid ${dividerColor}`,
            }}
          >
            <ItemText item={item} align={align} clampDescription />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            paddingTop: index === 0 ? 0 : gapPx,
            paddingBottom: index === items.length - 1 ? 0 : gapPx,
            borderTop: index === 0 ? undefined : `1px solid ${dividerColor}`,
          }}
        >
          <ItemText item={item} align={align} />
        </div>
      ))}
    </div>
  );
}

export function ScheduleRender({ config }: { config: ScheduleConfig; ctx: PageRenderContext }) {
  // A hand-edited JSON schema (or an item added then left blank) could carry
  // an item with no label — dropped at render time rather than shown as an
  // empty row, same "silently skip the unusable entry" approach as
  // carousel.tsx filtering out slides with no image url.
  const items = (config.items ?? []).filter((item) => item.label.trim());
  if (items.length === 0) return null;

  const style = config.style ?? "cards";
  const direction = config.direction ?? "vertical";
  const align = config.align ?? "left";
  const gapPx = Number.isFinite(config.gapPx) ? Math.min(200, Math.max(0, config.gapPx as number)) : 28;

  return (
    <div className="w-full">
      {config.heading && <ScheduleHeading heading={config.heading} />}
      <div className={config.heading ? "mt-4" : undefined}>
        {style === "timeline" ? (
          direction === "horizontal" ? (
            <TimelineHorizontal items={items} gapPx={gapPx} />
          ) : (
            <TimelineVertical items={items} gapPx={gapPx} />
          )
        ) : style === "minimal" ? (
          <MinimalLayout items={items} direction={direction} align={align} gapPx={gapPx} />
        ) : (
          <CardsLayout items={items} direction={direction} align={align} gapPx={gapPx} />
        )}
      </div>
    </div>
  );
}
