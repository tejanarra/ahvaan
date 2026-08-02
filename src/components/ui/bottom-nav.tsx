import Link from "next/link";
import type { ReactNode } from "react";

export interface BottomNavItem {
  href: string;
  label: string;
  isActive: boolean;
  icon: ReactNode;
}

// Mobile-only counterpart to SideNav (see side-nav.tsx) — the event
// workspace's four top-level sections as a fixed tab bar instead of a pill
// strip, so the screen's scarce top real estate isn't spent on nav. Desktop
// keeps SideNav; this never renders past `sm`.
export function BottomNav({ items, ariaLabel }: { items: BottomNavItem[]; ariaLabel: string }) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-stretch justify-around">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              item.isActive ? "text-accent" : "text-muted"
            }`}
          >
            {item.icon}
            <span className="truncate px-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
