import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";

export type EmailKind = "invite" | "reminder";

// `error` truncated to fit the audit row without needing a text column
// resize — the caught error's message, not a rendered stack trace.
export async function logEmailSend(input: {
  hostId: string;
  eventId: string;
  inviteId: string;
  kind: EmailKind;
  status: "sent" | "failed";
  error?: string;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("email_sends").insert({
    host_id: input.hostId,
    event_id: input.eventId,
    invite_id: input.inviteId,
    kind: input.kind,
    status: input.status,
    error: input.error ? input.error.slice(0, 300) : null,
  });
  if (error) throw new DataError(error.message);
}
