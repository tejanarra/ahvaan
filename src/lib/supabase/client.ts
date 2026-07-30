import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — only needed for the one flow that must run
// client-side: exchanging a password-recovery `code` for a session
// (src/app/reset-password/page.tsx). It writes the same auth cookies the
// server clients (auth-server.ts) read, so a server action called right
// after works off the same session. Every other read/write in this app
// goes through createAuthServerClient or createServiceRoleClient instead.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
