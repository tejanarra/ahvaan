import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getForm } from "@/lib/data/forms";
import { Tabs } from "@/components/ui/tabs";
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

  const base = `/dashboard/events/${eventId}/forms/${formId}`;

  return (
    <div>
      <FormHeader eventId={eventId} formId={formId} name={form.name} />
      <div className="mt-4">
        <Tabs
          items={[
            { href: `${base}/fields`, label: "Fields" },
            { href: `${base}/data`, label: "Data" },
            { href: `${base}/actions`, label: "Actions" },
          ]}
        />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
