"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type AuthState } from "@/lib/auth-actions";
import { AuthLayout } from "@/components/auth-layout";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { status: "idle" };

function OAuthError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return <p className="text-sm font-medium text-destructive">{error}</p>;
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your events and RSVPs."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <Suspense fallback={null}>
          <OAuthError />
        </Suspense>

        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={formAction} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoFocus autoComplete="email" />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </Field>

          <Link href="/forgot-password" className="block text-right text-xs text-muted hover:text-foreground">
            Forgot password?
          </Link>

          {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}

          <Button type="submit" loading={pending} className="w-full">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
