import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getForm } from "@/lib/data/forms";
import { FieldsBuilder } from "./fields-builder";

export const dynamic = "force-dynamic";

export default async function FormFieldsPage({ params }: { params: Promise<{ eventId: string; formId: string }> }) {
  const { eventId, formId } = await params;
  const host = await requireHost();
  const form = await getForm(host.id, eventId, formId);
  if (!form) notFound();

  return <FieldsBuilder eventId={eventId} formId={formId} schema={form.schema} />;
}
