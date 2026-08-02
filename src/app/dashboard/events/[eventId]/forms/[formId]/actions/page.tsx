import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getForm } from "@/lib/data/forms";
import { ActionsEditor } from "../../../actions-editor";
import { updateFormActionsAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function FormActionsPage({ params }: { params: Promise<{ eventId: string; formId: string }> }) {
  const { eventId, formId } = await params;
  const host = await requireHost();
  const form = await getForm(host.id, eventId, formId);
  if (!form) notFound();

  return (
    <ActionsEditor
      initialAction={form.actions}
      rsvpMode={false}
      onSave={async (action) => {
        "use server";
        await updateFormActionsAction(eventId, formId, action);
      }}
    />
  );
}
