"use server";

import { redirect } from "next/navigation";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { removeUnsubscribe } from "@/lib/data/email-unsubscribes";

// The "Undo" button on /unsubscribed — reuses the same signed token from
// the original unsubscribe link (still no login required), scoped to
// exactly the one event that token names.
export async function resubscribeToEventAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const payload = verifyUnsubscribeToken(token);
  // A token that fails to verify here (expired between page load and form
  // submit, or tampered) must not redirect to the success page — that
  // would tell the visitor they're resubscribed when nothing happened.
  if (!payload) {
    redirect("/unsubscribed?invalid=1");
  }
  await removeUnsubscribe(payload.eventId, payload.email);
  redirect("/unsubscribed/resubscribed");
}
