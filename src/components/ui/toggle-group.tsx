"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToggleGroupOption {
  value: string;
  label: ReactNode;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  /** A single selected value, or an array for multi-select callers. */
  value: string | string[];
  /**
   * Called with the clicked option's value. For multi-select, the caller
   * owns the toggle-inclusion logic (this component only reports clicks).
   */
  onChange: (value: string) => void;
  size?: "sm" | "md";
  /**
   * `true` stretches the group to its container's full width with segments
   * splitting evenly, at every breakpoint. `"mobile"` does the same but only
   * below `sm`, reverting to natural content width at `sm` and up. Default
   * (unset) is natural content width everywhere — the right choice for the
   * many small builder controls (align, width, S/M/L) that must never
   * stretch. This is a prop, not a className the caller has to get right,
   * because `src/lib/cn.ts` is a plain concatenator (not tailwind-merge):
   * a caller-supplied `sm:w-auto` cannot reliably cancel this component's
   * own unconditional `flex-1`, which is exactly the bug this prop fixes.
   */
  fullWidth?: boolean | "mobile";
  className?: string;
  "aria-label"?: string;
}

// Mobile heights are bumped to the 40px touch-target floor (docs/05); the
// visual (sm-and-up) heights are unchanged.
const SIZE_CLASSES = {
  sm: "h-10 px-2 text-xs sm:h-7",
  md: "h-10 px-3 text-sm sm:h-8",
};

const CONTAINER_CLASSES: Record<"none" | "always" | "mobile", string> = {
  none: "inline-flex",
  always: "flex w-full [&>button]:flex-1",
  mobile: "flex w-full sm:inline-flex sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none",
};

export function ToggleGroup({ options, value, onChange, size = "sm", fullWidth, className, ...rest }: ToggleGroupProps) {
  const isSelected = (optionValue: string) => (Array.isArray(value) ? value.includes(optionValue) : value === optionValue);
  const widthMode = fullWidth === true ? "always" : fullWidth === "mobile" ? "mobile" : "none";
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Roving tabindex (docs/04's a11y bar: "arrow keys in ToggleGroup/Tabs")
  // — only one segment is ever a Tab stop, matching a native radio group's
  // keyboard model instead of making every segment its own stop. The
  // selected option is that stop when there is one (single-select); the
  // first option otherwise (unselected single-select, or any multi-select
  // state, where "selected" isn't a single index).
  const selectedIndex = Array.isArray(value) ? -1 : options.findIndex((o) => o.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const count = options.length;
    // An empty `options` array is a real case (e.g. edit-rsvp-dialog.tsx
    // maps a field's own `options ?? []`) — `% 0` is NaN, and indexing
    // `options[NaN]` would throw on `.value` below. Nothing to navigate to
    // either way.
    if (count === 0) return;
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nextIndex = (activeIndex + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextIndex = (activeIndex - 1 + count) % count;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = count - 1;
    if (nextIndex === null) return;

    e.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
    // Single-select mirrors native radio-group behavior (selection follows
    // arrow-key focus); multi-select leaves selection to an explicit
    // click/Enter/Space so arrow keys can browse without toggling anything.
    if (!Array.isArray(value)) onChange(options[nextIndex].value);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface-sunken",
        CONTAINER_CLASSES[widthMode],
        className
      )}
      role="group"
      onKeyDown={onKeyDown}
      {...rest}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          type="button"
          tabIndex={i === activeIndex ? 0 : -1}
          onClick={() => onChange(option.value)}
          aria-pressed={isSelected(option.value)}
          className={cn(
            // `truncate` (not just whitespace-nowrap) is load-bearing when
            // `fullWidth` splits the group evenly on a narrow screen: a
            // long label would otherwise wrap to two lines while its
            // siblings stay one, breaking the segmented control's uniform
            // row height rather than just looking cramped.
            "truncate font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            SIZE_CLASSES[size],
            i > 0 && "border-l border-border",
            isSelected(option.value)
              ? "border border-border bg-surface text-foreground"
              : "text-muted hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
