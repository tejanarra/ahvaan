import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // The Supabase SSR client needs to be able to refresh the auth cookie on
  // every request (access tokens expire); the setAll callback both mutates
  // the outgoing request (so this same middleware invocation sees the
  // refreshed cookie) and re-creates the response so the refreshed cookie
  // actually reaches the browser.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Matches /dashboard and any nested route under it (event pages, settings,
  // etc.) — /login and /signup are outside this matcher entirely, so they
  // stay reachable without a session.
  matcher: ["/dashboard", "/dashboard/:path*"],
};
