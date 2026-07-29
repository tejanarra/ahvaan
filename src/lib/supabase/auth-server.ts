import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

// Session-aware Supabase client bound to the current request's auth
// cookies — used server-side (Server Components, Server Actions) for
// anything that needs to know "who is signed in." Never use this for
// data access; use createServiceRoleClient() for that and filter by the
// host id this client gives you (see requireHost() below).
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies can't
            // be mutated — safe to ignore since the middleware is what
            // actually refreshes the session cookie on each request.
          }
        },
      },
    }
  );
}

export async function getSessionUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Every dashboard route/action calls this first. Not just a UI guard — it's
// the thing that hands back the real, server-verified host id every
// subsequent query filters on.
export async function requireHost() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
