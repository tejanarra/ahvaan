import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { resolveFormSchema } from "@/lib/schemas/form-schema";
import { defaultPageSchema } from "@/lib/blocks/types";
import { parsePageSchema } from "@/lib/schemas/page-schema";
import { PageBuilder } from "./page-builder";

export const dynamic = "force-dynamic";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const host = await requireHost();

  const record = await getEventFull(host.id, eventId);
  if (!record) {
    notFound();
  }

  // Older events created before this feature existed have page_schema:
  // null (or, post-validation, anything that failed to parse) — seed the
  // same default layout in-memory (not persisted until the host hits Save)
  // so the builder never opens on a blank canvas.
  const initialSchema = parsePageSchema(record.page_schema) ?? defaultPageSchema();
  const formSchema = resolveFormSchema(record.form_schema);

  return <PageBuilder event={record} formSchema={formSchema} initialSchema={initialSchema} />;
}
