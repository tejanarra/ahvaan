import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!(await isValidAdminSessionToken(token))) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin"],
};
