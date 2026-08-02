import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { listForms } from "@/lib/data/forms";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { NewFormButton } from "./new-form-button";

export const dynamic = "force-dynamic";

export default async function EventFormsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const host = await requireHost();
  const forms = await listForms(host.id, eventId);

  return (
    <div>
      <PageHeader
        title="Forms"
        description="Any custom form for this event — feedback, song requests, T-shirt sizes, or anything else. Separate from the RSVP form, which lives under Guests → Fields."
        actions={<NewFormButton eventId={eventId} />}
      />

      {forms.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No forms yet"
          description="Create a named form, add whatever fields you need, then embed it on your invite page from the page builder."
          action={<NewFormButton eventId={eventId} />}
        />
      ) : (
        <div className="mt-4 space-y-2">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/dashboard/events/${eventId}/forms/${form.id}/fields`}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-border-strong hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{form.name}</p>
                <p className="text-xs text-muted">
                  {form.schema.fields.length} field{form.schema.fields.length === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
