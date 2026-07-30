import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { listEvents } from "@/lib/data/events";
import { getEventTypeLabel } from "@/lib/event-types";
import { getTheme } from "@/lib/themes";
import { formatEventDate } from "@/lib/format";
import { PlusIcon, CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCardMenu } from "./event-card-menu";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const host = await requireHost();
  const events = await listEvents(host.id);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Your events</h1>
        <Link href="/dashboard/events/new">
          <Button size="sm">
            <PlusIcon className="h-4 w-4" />
            Create event
          </Button>
        </Link>
      </div>

      {events.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => {
            const theme = getTheme(event.theme_id);
            return (
              <Card key={event.id} className="group relative flex flex-col overflow-hidden p-0">
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Manage ${event.title}`}
                />
                <div
                  className="h-1.5 shrink-0"
                  style={{
                    background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                    <div className="relative z-10">
                      <EventCardMenu eventId={event.id} eventTitle={event.title} />
                    </div>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {getEventTypeLabel(event.event_type)}
                    {event.event_date ? ` · ${formatEventDate(event.event_date)}` : ""}
                  </p>
                  <div className="mt-auto pt-4 text-xs font-medium text-accent">Manage →</div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          title="Plan something lovely"
          description="Create your first event to get a shareable invite page and guest RSVP tracking."
          action={
            <Link href="/dashboard/events/new">
              <Button size="sm">Create event</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
