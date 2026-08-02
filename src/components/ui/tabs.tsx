"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface TabItem {
  href: string;
  label: string;
  // Overrides the default exact-pathname match — for a tab whose section
  // has its own sub-routes not directly under this href (e.g. "Guests"
  // linking to the bare event route while also covering its sibling
  // /fields and /actions routes), so the parent tab still reads as active
  // while on one of those. Most callers leave this unset.
  isActive?: boolean;
}

/**
 * Route-driven tab navigation (not stateful ARIA tabs) — each tab is a real
 * page under a different URL, so the active tab is derived from the current
 * pathname rather than local state.
 */
export function Tabs({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-border">
      {items.map((item) => {
        const active = item.isActive ?? pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
