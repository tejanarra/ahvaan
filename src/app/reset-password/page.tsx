"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { updatePassword, type AuthState } from "@/lib/auth-actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth-layout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { status: "idle" };

type ExchangeState = "pending" | "ready" | "error";

// The emailed reset link lands here with a one-time `?code=`
// (resetPasswordForEmail's PKCE flow) — exchanging it for a real session is
// the one thing in this app that has to happen client-side (only the
// browser client can write the resulting auth cookies from a page load,
// not a Server Component), which is why this page can't just be the usual
// server-rendered form.
function useCodeExchange() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ExchangeState>("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorDescription = searchParams.get("error_description");

    // Every branch's setState runs inside this async callback (never
    // synchronously in the effect body) — this is the "subscribe to an
    // external system, set state when it resolves" shape, just with two of
    // the three outcomes resolved immediately instead of via the network.
    (async () => {
      if (errorDescription) {
        setMessage(errorDescription);
        setState("error");
        return;
      }
      if (!code) {
        setMessage("This reset link is missing or malformed.");
        setState("error");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage("This reset link is invalid or has expired.");
        setState("error");
      } else {
        setState("ready");
      }
    })();
  }, [searchParams]);

  return { state, message };
}

function ResetPasswordForm() {
  const { state: exchangeState, message: exchangeMessage } = useCodeExchange();
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  if (exchangeState === "pending") {
    return <p className="text-sm text-muted">Checking your reset link...</p>;
  }

  if (exchangeState === "error") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-destructive">{exchangeMessage}</p>
        <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" required autoFocus autoComplete="new-password" />
      </Field>

      {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}

      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Saving..." : "Save new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Checking your reset link...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
