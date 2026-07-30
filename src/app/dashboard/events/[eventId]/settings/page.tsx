import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/lib/event";
import { EventSettingsForm } from "./event-settings-form";

export const dynamic = "force-dynamic";

export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const host = await requireHost();
  const supabase = createServiceRoleClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("host_id", host.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return <EventSettingsForm event={event as EventRecord} />;
}
