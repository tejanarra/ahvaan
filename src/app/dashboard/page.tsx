import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { listEvents } from "@/lib/data/events";
import { getEventTypeLabel } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { PlusIcon, CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteEventButton } from "./delete-event-button";

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
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col p-4">
              <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <CalendarIcon className="h-3.5 w-3.5" />
                {getEventTypeLabel(event.event_type)}
                {event.event_date ? ` · ${formatEventDate(event.event_date)}` : ""}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Link href={`/dashboard/events/${event.id}`} className="text-xs font-medium text-accent hover:underline">
                  Manage
                </Link>
                <DeleteEventButton eventId={event.id} eventTitle={event.title} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          title="No events yet"
          description="Create your first one to get a shareable invite page and guest RSVP tracking."
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
