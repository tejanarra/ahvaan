"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/lib/auth-actions";
import { AuthLayout } from "@/components/auth-layout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { status: "idle" };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free — create and manage your own events."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoFocus autoComplete="email" />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>

        {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}
        {state.status === "info" && <p className="text-sm font-medium text-accent">{state.message}</p>}

        <Button type="submit" loading={pending} className="w-full">
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
