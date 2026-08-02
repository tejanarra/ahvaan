"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/components/icons";
import { SectionNav } from "@/components/ui/section-nav";
import { SideNav } from "@/components/ui/side-nav";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/lib/data/events";
import { eventNavGroups } from "./event-nav";

// The page builder needs the full available width/height (it's a dense
// editor, not a document page) and manages its own internal scrolling per
// panel — capping it to `max-w-6xl` and letting the shared dashboard <main>
// be the only scroll container (its default behavior, right for every other
// route here) was exactly why the palette/canvas never reached full width
// and only a single, whole-page scroll existed. Every other route keeps the
// original constrained, document-scrolling layout.
export function EventLayoutShell({
  eventId,
  eventTitle,
  eventSlug,
  eventStatus,
  children,
}: {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventStatus: EventStatus;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  const isDesign = pathname === `${base}/design`;

  // `h-full`/`flex-1` chains through the dashboard shell's own header,
  // padding, and this component's nav/title block all had to line up
  // perfectly for the builder to reach "the full page" — fragile, and still
  // short by however much that chrome took up. A `fixed inset-0` box is
  // sized directly from the viewport, independent of any of that, so it's
  // an unambiguous full-height/full-width guarantee. The builder already has
  // its own "Back to event" link, so losing the sidebar/dashboard header
  // while here is an acceptable trade for a real full-screen editor feel —
  // every other route is unaffected.
  if (isDesign) {
    return <div className="fixed inset-0 z-30 flex flex-col bg-background p-4">{children}</div>;
  }

  const groups = eventNavGroups(eventId);
  // Same isActive functions the sidebar uses, flattened into SectionNav's
  // `isActive` boolean shape for the mobile pill strip — one source of
  // truth (event-nav.ts) rendered as two different components per
  // breakpoint, not two separately-maintained nav lists.
  const topLevelItems = groups.map((g) => ({ href: g.href, label: g.label, isActive: g.isActive(pathname) }));

  return (
    <div className="mx-auto max-w-7xl">
      {/* Zone A — the one back-arrow in the whole event workspace. Never
          duplicated below: deeper contexts (e.g. the form workspace) use a
          plain-text crumb with no arrow icon instead (see PageHeader). */}
      <div className="shrink-0">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-1.5 text-caption hover:text-foreground sm:h-auto"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Events
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="text-title text-foreground">{eventTitle}</h1>
            <Badge variant={eventStatus === "published" ? "success" : "neutral"}>
              {eventStatus === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
          <Link
            href={eventStatus === "draft" ? `/events/${eventSlug}?preview=1` : `/events/${eventSlug}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-1.5 text-small text-muted hover:text-foreground sm:h-auto"
          >
            {eventStatus === "draft" ? "Preview page" : "View public page"}
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 border-b border-border" />

      {/* Mobile: sidebar hidden, a sticky pill strip takes its place.
          Guests'/a form's sub-items ride in the page's own PageHeader nav
          slot instead (same place on both breakpoints for those), so this
          strip never sits directly above a second nav row. */}
      <div className="sm:hidden">
        <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 pb-2 pt-3">
          <SectionNav ariaLabel="Event sections" items={topLevelItems} />
        </div>
      </div>

      <div className="sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8">
        {/* Zone B — desktop-only sidebar. `<main>` (src/app/dashboard/
            layout.tsx) is the page's scroll container, so `sticky top-0`
            here is correct with no extra plumbing. */}
        <div className="hidden border-r border-border pr-6 sm:block">
          <div className="sticky top-6">
            <SideNav ariaLabel="Event sections" groups={groups} />
          </div>
        </div>

        {/* Zone C */}
        <div className="min-w-0 pt-6 sm:pt-8">{children}</div>
      </div>
    </div>
  );
}
