"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/lib/auth-actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

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
