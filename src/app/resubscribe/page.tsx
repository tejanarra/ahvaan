"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestResubscribeAction, type ResubscribeFormState } from "./actions";

const initialState: ResubscribeFormState = { status: "idle" };

// `useSearchParams` requires a Suspense boundary in the App Router (it
// bails the wrapping segment to client-only rendering otherwise) — split
// into its own component so only this one part suspends, not the whole
// page shell.
function InvalidLinkNotice() {
  const invalid = useSearchParams().get("invalid");
  if (!invalid) return null;
  return (
    <p className="mt-4 text-sm text-destructive">
      That confirmation link expired or was already used — request a new one below.
    </p>
  );
}

export default function ResubscribePage() {
  const [state, formAction, pending] = useActionState(requestResubscribeAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-16 sm:px-6">
        <Link href="/" aria-label="ahvaan home" className="inline-flex">
          <BrandLockup />
        </Link>
        <h1 className="mt-8 font-display text-2xl text-foreground">Resubscribe to event emails</h1>
        <p className="mt-2 text-sm text-muted">
          Stopped getting invites or reminders you were expecting? Enter the address below and we&rsquo;ll email you a
          link to confirm.
        </p>
        <Suspense fallback={null}>
          <InvalidLinkNotice />
        </Suspense>

        {state.status === "sent" ? (
          <p className="mt-6 text-sm text-foreground">{state.message}</p>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" required autoFocus autoComplete="email" />
            </Field>
            {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}
            <Button type="submit" loading={pending} className="w-full">
              {pending ? "Sending..." : "Send confirmation link"}
            </Button>
          </form>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
