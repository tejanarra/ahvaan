import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";

// Every function here is scoped by (eventId, email) — never a bare email
// lookup — matching the table's own "per-event, not global" design (see
// supabase/schema-saas.sql's email_unsubscribes comment). Emails are
// lowercased on every read/write so a case-different resend attempt still
// matches an existing suppression.

export async function isUnsubscribed(eventId: string, email: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("event_id", eventId)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return Boolean(data);
}

// Idempotent — clicking an already-used unsubscribe link a second time
// (a real scenario: inbox link-preview scanners, or a guest just clicking
// twice) must not error. `ignoreDuplicates` on the unique (event_id, email)
// constraint makes a repeat call a no-op instead of a conflict.
export async function addUnsubscribe(hostId: string, eventId: string, email: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert(
      { host_id: hostId, event_id: eventId, email: email.trim().toLowerCase() },
      { onConflict: "event_id,email", ignoreDuplicates: true }
    );
  if (error) throw new DataError(error.message);
}

// Used by the unsubscribe-confirmation page's inline "undo" action (same
// signed token, so still no login required) — removes exactly one
// event's suppression.
export async function removeUnsubscribe(eventId: string, email: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("email_unsubscribes")
    .delete()
    .eq("event_id", eventId)
    .eq("email", email.trim().toLowerCase());
  if (error) throw new DataError(error.message);
}

// Used by the resubscribe self-service flow (src/app/resubscribe) — clears
// every event's suppression for one address in one call, since that form
// only ever collects an email, not a specific event.
export async function removeAllUnsubscribesForEmail(email: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("email_unsubscribes").delete().eq("email", email.trim().toLowerCase());
  if (error) throw new DataError(error.message);
}
