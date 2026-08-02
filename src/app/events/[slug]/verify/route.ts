import { NextResponse } from "next/server";
import { peekVerification, type VerificationSubjectType } from "@/lib/data/email-verification";
import { verifyRsvpEmailCode } from "@/lib/rsvp-submit";
import { verifyFormSubmissionCode } from "@/lib/form-submit";
import { verifyGuestVerification } from "@/lib/guest-verification";

export const dynamic = "force-dynamic";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// A GET-only version of this route — visit the link, code consumed
// immediately — is silently broken by corporate email gateways (Microsoft
// Defender/Outlook "Safe Links," many spam scanners) that prefetch every
// link in an email to scan it, burning the one-time code before the real
// recipient ever clicks. Splitting into GET (renders a plain "Confirm"
// button, no side effects — safe for a scanner to fetch) + POST (the
// actual one-time consume) is the standard mitigation: a scanner fetches
// and stops, a real click submits the form.
function confirmPage(vid: string, code: string, subjectType: VerificationSubjectType) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />` +
      `<title>Verify your email</title><style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:15vh auto;padding:0 1.5rem;text-align:center;color:#211E19}` +
      `h1{font-size:1.25rem}button{margin-top:1rem;padding:0.75rem 1.5rem;font-size:0.9rem;border:none;border-radius:0.5rem;background:#2F5D46;color:#fff;cursor:pointer}</style></head>` +
      `<body><h1>Confirm your email</h1><p>Click below to finish verifying.</p>` +
      `<form method="post"><input type="hidden" name="vid" value="${escapeHtml(vid)}" /><input type="hidden" name="code" value="${escapeHtml(code)}" /><input type="hidden" name="type" value="${escapeHtml(subjectType)}" /><button type="submit">Confirm verification</button></form>` +
      `</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function errorPage(message: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />` +
      `<title>Verification failed</title><style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:15vh auto;padding:0 1.5rem;text-align:center;color:#211E19}` +
      `h1{font-size:1.25rem}</style></head><body><h1>${escapeHtml(message)}</h1></body></html>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vid = url.searchParams.get("vid") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const subjectType = url.searchParams.get("type") === "form" ? "form" : "rsvp";

  if (!vid || !code) return errorPage("That link is no longer valid.");
  return confirmPage(vid, code, subjectType);
}

// `purpose` decides which finalize path to take:
// - 'identity' (the common case — the page-level "verify once for this
//   event" gate, src/lib/guest-verification.ts): sets the guest-session
//   cookie, nothing else to write.
// - 'submit': the per-form fallback, only still reachable via the no-JS
//   embedded-HTML-form API routes (no page-level gate there).
// Either way this redirects back into the event page with `?verified=<vid>`
// — kept only so a *different*, still-open tab that originally requested
// the code can pick up a "done" broadcast over BroadcastChannel (see
// email-verification-modal.tsx) without a manual refresh.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const origin = new URL(request.url).origin;
  const formData = await request.formData();
  const vid = String(formData.get("vid") ?? "");
  const code = String(formData.get("code") ?? "");
  const subjectType = formData.get("type") === "form" ? "form" : "rsvp";

  const redirectUrl = new URL(`/events/${slug}`, origin);

  const info = vid ? await peekVerification(subjectType, vid).catch(() => null) : null;
  if (!info) {
    redirectUrl.searchParams.set("verifyError", "That link is no longer valid.");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (info.purpose === "identity") {
    const result = await verifyGuestVerification(info.subjectId, vid, code);
    if (result.status === "error") {
      redirectUrl.searchParams.set("verifyError", result.message);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    redirectUrl.searchParams.set("verified", vid);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const result = subjectType === "form" ? await verifyFormSubmissionCode(vid, code) : await verifyRsvpEmailCode(vid, code);

  if (result.status === "error") {
    redirectUrl.searchParams.set("verifyError", result.message);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  redirectUrl.searchParams.set("verified", vid);
  redirectUrl.searchParams.set("vtype", subjectType);
  if (subjectType === "form") redirectUrl.searchParams.set("vform", info.subjectId);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
