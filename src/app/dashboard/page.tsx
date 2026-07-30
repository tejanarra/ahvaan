import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getEventTypeLabel } from "@/lib/event-types";
import { PlusIcon, CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteEventButton } from "./delete-event-button";
import type { EventRecord } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const host = await requireHost();
  const supabase = createServiceRoleClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", host.id)
    .order("created_at", { ascending: false });

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

      {error && <p className="mt-6 text-sm font-medium text-destructive">Failed to load events: {error.message}</p>}

      {events?.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(events as EventRecord[]).map((event) => (
            <Card key={event.id} className="flex flex-col p-4">
              <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <CalendarIcon className="h-3.5 w-3.5" />
                {getEventTypeLabel(event.event_type)}
                {event.event_date ? ` · ${event.event_date}` : ""}
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
