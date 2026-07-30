import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { resolveFormSchema } from "@/lib/schemas/form-schema";
import { FormBuilder } from "./form-builder";

export const dynamic = "force-dynamic";

export default async function EventFormPage({
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

  const schema = resolveFormSchema(event.form_schema);

  return <FormBuilder eventId={event.id} schema={schema} />;
}
