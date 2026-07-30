"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/components/icons";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/lib/data/events";

// The page builder needs the full available width/height (it's a dense
// editor, not a document page) and manages its own internal scrolling per
// panel — capping it to `max-w-6xl` and letting the shared dashboard <main>
// be the only scroll container (its default behavior, right for every other
// tab here) was exactly why the palette/canvas never reached full width and
// only a single, whole-page scroll existed. Every other tab keeps the
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
  // padding, and this component's tabs/title block all had to line up
  // perfectly for the builder to reach "the full page" — fragile, and still
  // short by however much that chrome took up. A `fixed inset-0` box is
  // sized directly from the viewport, independent of any of that, so it's
  // an unambiguous full-height/full-width guarantee. The builder already has
  // its own "Back to event" link, so losing the tabs/dashboard header while
  // here is an acceptable trade for a real full-screen editor feel — every
  // other tab is unaffected.
  if (isDesign) {
    return <div className="fixed inset-0 z-30 flex flex-col bg-background p-4">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="shrink-0">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
          Events
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{eventTitle}</h1>
            <Badge variant={eventStatus === "published" ? "success" : "neutral"}>
              {eventStatus === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
          <Link
            href={eventStatus === "draft" ? `/e/${eventSlug}?preview=1` : `/e/${eventSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            {eventStatus === "draft" ? "Preview page" : "View public page"}
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4">
          <Tabs
            items={[
              { href: base, label: "Guests" },
              { href: `${base}/design`, label: "Invite page" },
              { href: `${base}/form`, label: "RSVP form" },
              { href: `${base}/settings`, label: "Settings" },
            ]}
          />
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
