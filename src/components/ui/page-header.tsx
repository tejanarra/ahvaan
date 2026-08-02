import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// The one header block every event-workspace content page opens with — no
// hooks, so server-component pages (the Guests/Forms/Settings pages, all
// server components) can render it directly. `crumb` is a plain-text link,
// deliberately with no arrow icon: the event workspace has exactly one
// back-arrow (the "← Events" link in event-layout-shell.tsx's header band),
// and a second arrow here previously read as a confusing duplicate back
// button. `title` is a ReactNode (not a string) so the form workspace can
// pass its inline-rename control through this same slot instead of
// bypassing PageHeader for something bespoke.
export function PageHeader({
  crumb,
  title,
  description,
  actions,
  nav,
  inlineActions,
}: {
  crumb?: { href: string; label: string };
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  nav?: ReactNode;
  /**
   * Keeps `actions` on the same row as `title` at every width instead of
   * stacking below it on mobile. Default (false) is right for multi-button
   * `actions` meant to become full-width stacked CTAs on mobile (e.g. the
   * Guests page's Export/Share pair). A single small action (typically an
   * icon-only button, e.g. form-header.tsx's "delete form") looks wrong
   * stacked full-width below the title — it visually reads as a stray icon
   * floating in empty space rather than an inline action next to the
   * title it acts on.
   */
  inlineActions?: boolean;
}) {
  return (
    <div className="border-b border-border pb-6">
      {crumb && (
        <Link href={crumb.href} className="mb-2 inline-flex h-11 items-center text-caption hover:text-foreground sm:h-auto">
          {crumb.label}
        </Link>
      )}
      <div
        className={
          inlineActions
            ? "flex items-start justify-between gap-3"
            : "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        }
      >
        <div className="min-w-0">
          <div className="text-heading text-foreground">{title}</div>
          {description && <p className="mt-1 max-w-[65ch] text-small text-muted">{description}</p>}
        </div>
        {actions && (
          <div className={cn("flex shrink-0 items-center gap-2", !inlineActions && "*:flex-1 sm:*:flex-none")}>
            {actions}
          </div>
        )}
      </div>
      {nav && <div className="mt-4">{nav}</div>}
    </div>
  );
}
