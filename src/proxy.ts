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

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (!user && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // A signed-in host has no reason to see the sign-in/sign-up forms again —
  // previously nothing redirected them, so a stale bookmark or a browser
  // "back" into /login just re-rendered the form on top of a live session.
  if (user && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // /dashboard and everything nested under it require a session; /login and
  // /signup are the inverse — they require the *absence* of one. Both
  // directions have to be checked in the same place so a session change
  // (sign in, sign out) is reflected on the very next navigation rather than
  // only in the one direction that used to be covered.
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/signup"],
};
