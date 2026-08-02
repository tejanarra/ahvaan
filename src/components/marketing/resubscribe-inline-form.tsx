"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestResubscribeAction, type ResubscribeFormState } from "@/app/resubscribe/actions";

const initialState: ResubscribeFormState = { status: "idle" };

// Compact version of /resubscribe's form, embedded in the marketing home
// page's footer band — for a guest who stopped getting a host's emails
// after unsubscribing (maybe by mistake, maybe from a stale link) and
// lands here instead of the standalone page. Same double-opt-in flow
// underneath (src/lib/resubscribe.ts): submitting just queues a
// confirmation email, nothing is resubscribed until that link is clicked.
export function ResubscribeInlineForm() {
  const [state, formAction, pending] = useActionState(requestResubscribeAction, initialState);

  if (state.status === "sent") {
    return <p className="text-sm text-muted">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <p className="text-xs text-muted sm:mr-2">Not getting event emails you expected?</p>
      <div className="flex w-full max-w-xs gap-2 sm:w-auto">
        <Input name="email" type="email" placeholder="you@example.com" required className="h-9 text-sm" aria-label="Email address" />
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Resubscribe
        </Button>
      </div>
      {state.status === "error" && <p className="text-xs text-destructive">{state.message}</p>}
    </form>
  );
}
