"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/lib/auth-actions";
import { AuthLayout } from "@/components/auth-layout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { status: "idle" };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {state.status === "info" ? (
        <p className="text-sm text-foreground">{state.message}</p>
      ) : (
        <form action={formAction} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoFocus autoComplete="email" />
          </Field>

          {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}

          <Button type="submit" loading={pending} className="w-full">
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
