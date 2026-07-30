import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveFormSchema } from "@/lib/form-schema";
import type { EventRecord } from "@/lib/event";
import { FormBuilder } from "./form-builder";

export const dynamic = "force-dynamic";

export default async function EventFormPage({
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

  const schema = resolveFormSchema((event as EventRecord).form_schema);

  return <FormBuilder eventId={event.id} schema={schema} />;
}
