import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventNav } from "@/lib/data/events";
import { EventLayoutShell } from "./event-layout-shell";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const host = await requireHost();

  const event = await getEventNav(host.id, eventId);
  if (!event) {
    notFound();
  }

  return (
    <EventLayoutShell eventId={eventId} eventTitle={event.title} eventSlug={event.slug}>
      {children}
    </EventLayoutShell>
  );
}
