"use server";

import { requestResubscribe } from "@/lib/resubscribe";

export type ResubscribeFormState = { status: "idle" | "sent" | "error"; message?: string };

// Always resolves to the same "sent" outcome regardless of whether the
// email exists/has anything unsubscribed, or whether it was actually rate
// limited — see requestResubscribe's own comment for why (anti-
// enumeration, matching requestPasswordReset in src/lib/auth-actions.ts).
// A visibly different message on rate-limit would tell a prober "this
// address gets checked often," which is its own small leak.
export async function requestResubscribeAction(_prevState: ResubscribeFormState, formData: FormData): Promise<ResubscribeFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", message: "Enter an email address." };

  await requestResubscribe(email);

  return {
    status: "sent",
    message: "If that address has any unsubscribed events, we've sent a link to confirm resubscribing.",
  };
}
