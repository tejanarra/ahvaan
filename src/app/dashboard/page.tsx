import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTheme } from "@/lib/themes";
import { getEventTypeLabel } from "@/lib/event-types";
import { PlusIcon } from "@/components/icons";
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl uppercase tracking-[0.1em] text-gold-dark sm:text-2xl">
          Your Events
        </h1>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-1.5 rounded-lg bg-gold-dark px-4 py-2 font-display text-xs uppercase tracking-wider text-white shadow-sm transition hover:bg-[#5c3a0c]"
        >
          <PlusIcon className="h-4 w-4" />
          Create event
        </Link>
      </div>

      {error && (
        <p className="mt-6 text-sm font-medium text-red-600">
          Failed to load events: {error.message}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(events as EventRecord[] | null)?.map((event) => {
          const theme = getTheme(event.theme_id);
          return (
            <div
              key={event.id}
              className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className="h-16"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                }}
              />
              <div className="p-4">
                <p className="truncate font-display text-lg text-foreground">{event.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-foreground/50">
                  {getEventTypeLabel(event.event_type)}
                  {event.event_date ? ` · ${event.event_date}` : ""}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gold/10 pt-3">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="font-display text-xs uppercase tracking-wider text-gold-dark hover:underline"
                  >
                    Manage
                  </Link>
                  <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events?.length === 0 && (
        <p className="mt-6 rounded-xl border border-gold/25 bg-white/80 px-4 py-10 text-center text-sm text-foreground/50 shadow-sm">
          No events yet. Create your first one to get a shareable invite page
          and guest RSVP tracking.
        </p>
      )}
    </div>
  );
}
