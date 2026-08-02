"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { DOCS_NAV } from "./docs-nav-data";

// The Docs surface's own navigation component — deliberately NOT `SideNav`
// (docs/04-design-system.md's `SideNav` is explicit that it never nests a
// second level; a docs topic tree genuinely needs one, so per doc 10 this
// earns its own component built from the same tokens rather than bending
// that rule). Structurally: a flat list of always-expanded sections (no
// accordion — the whole tree is short enough to just show), current-page
// state = accent-soft fill + accent text + left accent rail, matching
// SideNav's own "current" treatment.
export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-6">
      {DOCS_NAV.map((group) => (
        <div key={group.label} className="space-y-4">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.label}</p>
          {group.sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">{section.title}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-[var(--radius-sm)] border-l-2 px-2.5 py-1.5 text-sm transition-colors",
                          active
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-transparent text-muted hover:bg-surface-hover hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
