"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MenuItem = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  icon?: ReactNode;
};

// Small dependency-free dropdown for card overflow actions and the account
// menu. Closes on outside click and Escape; shadow-pop per docs/04.
export function DropdownMenu({
  trigger,
  items,
  align = "end",
}: {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1.5 min-w-[10rem] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface py-1 shadow-[var(--shadow-pop)]",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => (
            <button
              // Callers build labels from user-editable names (e.g. a
              // container's "Move to" list, page-builder.tsx's
              // collectContainerOptions) — several containers can share the
              // same default label until named, so the label alone isn't a
              // safe React key.
              key={`${item.label}-${i}`}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                // py-2.5 hits the 40px touch-target floor (docs/05) on
                // mobile; sm:py-2 keeps the tighter desktop density.
                "flex w-full items-center gap-2 truncate px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-hover sm:py-2",
                item.destructive ? "text-destructive" : "text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
