import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";

export type EmailKind = "invite" | "reminder";
// "suppressed" = the recipient had unsubscribed (email_unsubscribes) so
// deliverInviteEmail/deliverReminderEmail deliberately skipped sending —
// distinct from "failed" (an actual send error) so the host's send-status
// UI can tell "didn't send because they opted out" from "something broke."
export type EmailStatus = "sent" | "failed" | "suppressed";

// `error` truncated to fit the audit row without needing a text column
// resize — the caught error's message, not a rendered stack trace.
export async function logEmailSend(input: {
  hostId: string;
  eventId: string;
  inviteId: string;
  kind: EmailKind;
  status: EmailStatus;
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

// Batched form of logEmailSend for a bulk-send loop (e.g.
// sendReminderEmails) — one multi-row insert for the whole batch instead of
// one round trip per invite (docs-audit M11). The actual email sends still
// happen one at a time (respecting the provider's own rate limits), only
// the resulting audit-log writes are batched.
export async function logEmailSends(
  inputs: Array<{
    hostId: string;
    eventId: string;
    inviteId: string;
    kind: EmailKind;
    status: EmailStatus;
    error?: string;
  }>
) {
  if (inputs.length === 0) return;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("email_sends").insert(
    inputs.map((input) => ({
      host_id: input.hostId,
      event_id: input.eventId,
      invite_id: input.inviteId,
      kind: input.kind,
      status: input.status,
      error: input.error ? input.error.slice(0, 300) : null,
    }))
  );
  if (error) throw new DataError(error.message);
}
