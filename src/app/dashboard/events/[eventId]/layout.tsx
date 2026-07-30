import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
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
  const supabase = createServiceRoleClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return (
    <EventLayoutShell eventId={eventId} eventTitle={event.title} eventSlug={event.slug}>
      {children}
    </EventLayoutShell>
  );
}
