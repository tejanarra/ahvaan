import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { EventSettingsForm } from "./event-settings-form";

export const dynamic = "force-dynamic";

export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) {
    notFound();
  }

  return <EventSettingsForm event={event} />;
}
