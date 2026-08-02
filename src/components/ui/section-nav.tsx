"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useScrollStrip } from "@/components/ui/use-scroll-strip";

export interface NavItem {
  href: string;
  label: string;
  // Overrides the default exact-pathname match — for an item whose section
  // has its own sub-routes not directly under this href. Most callers leave
  // this unset.
  isActive?: boolean;
}

// Matches <main>'s own gutter (src/app/dashboard/layout.tsx) exactly, so a
// full-bleed scroll strip is clipped by the screen edge rather than by this
// component's own padding — that clipping is what tells a touch user "this
// scrolls."
export const SCROLL_STRIP_BLEED = "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10";

/**
 * Secondary, in-page navigation (Guests' Data/Fields/Actions/Settings, a
 * form workspace's Fields/Data/Actions) — borderless accent-soft pills. On
 * desktop the event workspace's primary nav is the vertical `SideNav`
 * sidebar, so this never has to visually compete with anything above it; on
 * mobile it doubles as the top-level nav strip too (see event-layout-shell).
 * It lives inside the page's own section-header row (see `actions`), not as
 * a full-bleed bar of its own — that placement, plus the lighter type/fill,
 * is what makes it read as subordinate to the sidebar.
 */
export function SectionNav({
  items,
  ariaLabel,
  actions,
  className,
}: {
  items: NavItem[];
  ariaLabel: string;
  actions?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const activeItem = items.find((item) => item.isActive ?? pathname === item.href) ?? items[0];
  const { trackRef, activeRef, overflowing } = useScrollStrip<HTMLDivElement>(activeItem?.href ?? "");

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <nav
        aria-label={ariaLabel}
        ref={trackRef}
        className={cn(
          "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[scroll-snap-type:x_proximity]",
          SCROLL_STRIP_BLEED,
          "sm:mx-0 sm:px-0",
          overflowing &&
            "[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:[mask-image:none]"
        )}
      >
        {items.map((item) => {
          const active = item === activeItem;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={active ? activeRef : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center sm:h-8",
                "[scroll-snap-align:start]"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors",
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      {actions && <div className="flex items-center gap-2 *:flex-1 sm:*:flex-none">{actions}</div>}
    </div>
  );
}
