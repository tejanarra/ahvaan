import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { resolveFormSchema } from "@/lib/schemas/form-schema";
import { FormBuilder } from "./form-builder";
import { PageHeader } from "@/components/ui/page-header";
import { SectionNav } from "@/components/ui/section-nav";
import { guestsSubItems } from "../event-nav";

export const dynamic = "force-dynamic";

export default async function EventFieldsPage({
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

  return (
    <div>
      <PageHeader
        title="RSVP form fields"
        description="What you ask guests when they RSVP."
        nav={<SectionNav ariaLabel="Guests sections" items={guestsSubItems(eventId)} />}
      />
      <div className="mt-6">
        <FormBuilder event={event} schema={schema} />
      </div>
    </div>
  );
}
