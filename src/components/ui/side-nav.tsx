"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SideNavGroup {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

// Row treatment: `src/lib/cn.ts` is a plain classnames concatenator, not
// tailwind-merge — two classes that set the same CSS property don't
// reliably resolve by source order (see the same warning in
// src/components/brand.tsx). So each state below is one complete,
// mutually-exclusive class string, never a "default" string plus an
// "override" string layered on top.
const ROW_BASE = "flex h-8 items-center rounded-[var(--radius-sm)] px-3 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const ROW_CURRENT = `${ROW_BASE} relative bg-accent-soft font-semibold text-accent before:absolute before:inset-y-0 before:-left-3 before:w-0.5 before:rounded-full before:bg-accent`;
const ROW_DEFAULT = `${ROW_BASE} text-muted hover:bg-surface-hover hover:text-foreground`;

/**
 * The event workspace's one persistent nav surface (desktop only — see
 * event-layout-shell.tsx for the mobile pill-strip fallback). A flat list of
 * top-level sections only — each section's own sub-pages (Guests'
 * Data/Fields/Actions/Settings, a form's Fields/Data/Actions) live as a
 * `SectionNav` pill row in that page's own `PageHeader` instead, so the
 * sidebar never has to represent a second level.
 */
export function SideNav({ groups, ariaLabel }: { groups: SideNavGroup[]; ariaLabel: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="flex flex-col gap-1">
      {groups.map((group) => {
        const active = group.isActive(pathname);
        return (
          <Link
            key={group.href}
            href={group.href}
            aria-current={active ? "page" : undefined}
            className={active ? ROW_CURRENT : ROW_DEFAULT}
          >
            {group.label}
          </Link>
        );
      })}
    </nav>
  );
}
