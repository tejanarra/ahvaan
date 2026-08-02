import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

// Nonce-based CSP (docs-audit M3) — replaces the previous static
// `script-src 'self' 'unsafe-inline'` in next.config.ts, which meaningfully
// weakened CSP's XSS protection at the top-level document ('unsafe-inline'
// is ignored by browsers once a nonce/hash source is present, but until
// this change there was no nonce source, so 'unsafe-inline' was the only
// thing in effect). Generated here, not in next.config.ts's static
// headers(), because a nonce has to be a fresh random value per request —
// a reused nonce is not meaningfully different from 'unsafe-inline'.
// 'strict-dynamic' lets the nonce'd bootstrap script's own dynamically-
// injected chunks (Next's client-side chunk loading) run without needing
// every chunk individually nonced — the standard pairing for a nonce-based
// CSP on a framework that loads code dynamically.
//
// style-src/img-src/etc. are unchanged from the previous next.config.ts
// policy (see that file's own remaining static headers) — only script-src
// needed to move here, since it's the only directive this app needs a
// per-request value for.
function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co${isDev ? " ws:" : ""}`,
    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  // Forwarded as a request header so Server Components can read it back
  // (src/lib/csp-nonce.ts) — currently only the sandboxed custom-code
  // iframes need it, to nonce their own inline <script> so it survives
  // being inherited by the srcdoc frame's CSP (see sandbox.ts's own
  // comment on why that inheritance happens at all).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  const isAuthGated = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  // Every other route (marketing, guest event pages, API routes) only
  // needs the CSP/nonce header above — running the Supabase session-
  // refresh check on every single request would add an extra round trip to
  // routes that don't need auth, including the public guest page (the
  // app's highest-traffic, and until recently uncached, route — see
  // src/lib/data/events.ts). The matcher below now covers virtually every
  // path (previously just the four listed here) so this header applies
  // site-wide; that widening is exactly why this early return matters.
  if (!isAuthGated && !isAuthPage) {
    return response;
  }

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set("Content-Security-Policy", csp);
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

  if (!user && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  // A signed-in host has no reason to see the sign-in/sign-up forms again —
  // previously nothing redirected them, so a stale bookmark or a browser
  // "back" into /login just re-rendered the form on top of a live session.
  if (user && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own static/image-optimizer internals and
    // the service worker file — those never render HTML that needs a
    // CSP/nonce, and excluding them keeps this middleware off pure asset
    // requests. Every actual page/route (marketing, dashboard, guest
    // pages, API routes) is covered so the CSP header applies site-wide.
    "/((?!_next/static|_next/image|sw\\.js).*)",
  ],
};
