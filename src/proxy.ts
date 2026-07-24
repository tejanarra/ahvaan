import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  // Login itself must stay reachable without a session, or an unauthenticated
  // visitor could never obtain one (matcher below covers /admin/:path* so this
  // page is included in it — this check carves it back out explicitly rather
  // than relying on the matcher pattern alone).
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!(await isValidAdminSessionToken(token))) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matches /admin and any nested route under it (e.g. a future /admin/export),
  // not just the exact /admin path — a plain "/admin" entry would silently
  // leave new nested admin routes unprotected.
  matcher: ["/admin", "/admin/:path*"],
};
