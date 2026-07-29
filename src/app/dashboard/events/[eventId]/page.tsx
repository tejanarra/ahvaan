import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/lib/event";
import { EventSettingsPanel } from "./event-settings-panel";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
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

  return (
    <div className="space-y-6">
      <EventSettingsPanel event={event as EventRecord} />

      <div className="rounded-2xl border border-dashed border-gold/30 bg-white/60 p-6 text-center text-sm text-foreground/50">
        Guest list, invites, and RSVPs land here next.
      </div>
    </div>
  );
}
