import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getForm } from "@/lib/data/forms";
import { FormHeader } from "./form-header";

export const dynamic = "force-dynamic";

export default async function FormLayout({
  params,
  children,
}: {
  params: Promise<{ eventId: string; formId: string }>;
  children: ReactNode;
}) {
  const { eventId, formId } = await params;
  const host = await requireHost();
  const form = await getForm(host.id, eventId, formId);
  if (!form) notFound();

  return (
    <div>
      <FormHeader eventId={eventId} formId={formId} name={form.name} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
