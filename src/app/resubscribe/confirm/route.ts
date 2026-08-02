import { NextResponse, type NextRequest } from "next/server";
import { confirmResubscribe } from "@/lib/resubscribe";

// The link sent by requestResubscribe (src/lib/resubscribe.ts) — clicking
// it is the actual resubscribe action (double opt-in); the /resubscribe
// form submission alone never changes anything.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await confirmResubscribe(token);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  return NextResponse.redirect(
    result.status === "confirmed" ? `${siteUrl}/unsubscribed/resubscribed` : `${siteUrl}/resubscribe?invalid=1`,
    { status: 303 }
  );
}
