import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { resolveFormSchema } from "@/lib/schemas/form-schema";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
import { updateSubmissionModeAction } from "../actions";
import { SubmissionModeEditor } from "../submission-mode-editor";
import { GuestsSubTabs } from "../guests-sub-tabs";

export const dynamic = "force-dynamic";

// One event-wide setting, not a Guests-only one: it also governs every
// generic Forms form under this event (see events.submission_mode's own
// comment) — Forms no longer has its own separate Settings tab.
export default async function RsvpSettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const host = await requireHost();
  const event = await getEventFull(host.id, eventId);
  if (!event) notFound();

  const schema = resolveFormSchema(event.form_schema);
  const emailFieldMissing = !schema.fields.some((f) => f.role === "email");

  return (
    <div>
      <GuestsSubTabs eventId={eventId} />
      <div className="mt-4">
        <SubmissionModeEditor
          initialMode={parseSubmissionMode(event.submission_mode)}
          emailFieldMissing={emailFieldMissing}
          onSave={async (mode) => {
            "use server";
            await updateSubmissionModeAction(eventId, mode);
          }}
        />
      </div>
    </div>
  );
}
