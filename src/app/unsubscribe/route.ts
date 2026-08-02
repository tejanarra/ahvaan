import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { addUnsubscribe } from "@/lib/data/email-unsubscribes";

// One-click unsubscribe, no login required — the signed token embedded in
// every invite/reminder/verification email (src/lib/email.ts) is the only
// credential needed, "by anyone at anytime" per the product decision.
// Handles GET (a guest clicking the link in their mail client) and POST
// (mail providers that support RFC 8058 one-click unsubscribe use the same
// URL from the List-Unsubscribe header) identically.
async function handle(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const payload = verifyUnsubscribeToken(token);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (!payload) {
    return NextResponse.redirect(`${siteUrl}/unsubscribed?invalid=1`, { status: 303 });
  }

  await addUnsubscribe(payload.hostId, payload.eventId, payload.email);

  return NextResponse.redirect(`${siteUrl}/unsubscribed?token=${encodeURIComponent(token)}`, { status: 303 });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
