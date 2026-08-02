import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/auth-server";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { AuthLayout } from "@/components/auth-layout";

// The emailed reset link goes through /auth/callback first, which exchanges
// the one-time `?code=` for a session and redirects here — so by the time
// this page renders, the recovery session (if the link was valid) already
// exists in cookies. No client-side exchange needed.
export default async function ResetPasswordPage() {
  const user = await getSessionUser();

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
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-destructive">
            This reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            Request a new link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
