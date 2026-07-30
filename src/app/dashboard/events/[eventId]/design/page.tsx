import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/lib/event";
import { resolveFormSchema } from "@/lib/form-schema";
import { resolvePageSchema, defaultPageSchema } from "@/lib/page-blocks/types";
import { PageBuilder } from "./page-builder";

export const dynamic = "force-dynamic";

export default async function DesignPage({
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

  const record = event as EventRecord;
  // Older events created before this feature existed have page_schema:
  // null — seed the same default layout in-memory (not persisted until
  // the host hits Save) so the builder never opens on a blank canvas.
  const initialSchema = resolvePageSchema(record.page_schema) ?? defaultPageSchema();
  const formSchema = resolveFormSchema(record.form_schema);

  return (
    <PageBuilder event={record} formSchema={formSchema} initialSchema={initialSchema} />
  );
}
