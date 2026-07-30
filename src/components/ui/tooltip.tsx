"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Minimal hover/focus tooltip — every icon-only button should wrap its
// content in this (a11y bar in docs/04-design-system.md).
export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute -top-1.5 left-1/2 z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-[0_4px_16px_rgb(33_30_25/0.10)] transition-opacity duration-150",
          open && "opacity-100",
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
