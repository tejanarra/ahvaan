import { NextResponse } from "next/server";
import { submitRsvpFromFormData, verifyRsvpEmailCode } from "@/lib/rsvp-submit";
import { isRequestTooLarge } from "@/lib/max-request-size";

// Public, unauthenticated write endpoint — same trust model as the
// submitRsvp server action (the invite id is the real access control, not
// this route's own auth), but reachable via a plain HTML <form method="post">
// instead of a Next.js Server Action. Server Actions can't be posted to
// from inside a sandboxed opaque-origin iframe (they need a same-origin
// fetch carrying Next's internal action-id header); a plain form POST has
// no such restriction, so this is what makes "embed a working RSVP form in
// a custom-HTML block" possible at all. See lib/rsvp-submit.ts for the
// shared, single implementation both paths validate against.
export const dynamic = "force-dynamic";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function htmlPage(title: string, body: string, status: number) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />` +
      `<title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;text-align:center;color:#211E19}` +
      `h1{font-size:1.25rem}</style></head><body><h1>${escapeHtml(title)}</h1><p>${body}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (isRequestTooLarge(request)) {
    if (wantsJson) return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
    return htmlPage("RSVP not saved", "That submission was too large.", 413);
  }

  const formData = await request.formData();

  // A hand-embedded HTML form has no client JS to hold a "code sent, please
  // enter it" state between requests — this second field, present only on
  // the code-entry follow-up form, tells this same endpoint to verify
  // instead of submit, so the two-phase email_verified flow still works
  // without any script (see the "check your email" page below).
  const otpVerificationId = String(formData.get("otpVerificationId") ?? "").trim();
  const otpCode = String(formData.get("otpCode") ?? "").trim();
  const result = otpVerificationId
    ? await verifyRsvpEmailCode(otpVerificationId, otpCode)
    : await submitRsvpFromFormData(formData);

  if (result.status === "error") {
    if (wantsJson) return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
    return htmlPage("RSVP not saved", escapeHtml(result.message), 400);
  }

  if (result.status === "verification_sent") {
    if (wantsJson) {
      return NextResponse.json({ ok: true, verificationRequired: true, verificationId: result.verificationId, email: result.email });
    }
    return htmlPage(
      "Check your email",
      `We sent a verification code to ${escapeHtml(result.email)}. Enter it below to finish your RSVP.` +
        `<form method="post" style="margin-top:1.5rem;display:flex;gap:0.5rem;justify-content:center;">` +
        `<input type="hidden" name="otpVerificationId" value="${escapeHtml(result.verificationId)}" />` +
        `<input type="text" name="otpCode" placeholder="6-digit code" required style="padding:0.5rem;font-size:1rem;" />` +
        `<button type="submit" style="padding:0.5rem 1rem;">Verify</button>` +
        `</form>`,
      200
    );
  }

  if (wantsJson) return NextResponse.json({ ok: true, responses: result.responses });

  // A host-provided redirect target lets the embedded form send guests
  // somewhere styled to match their custom page instead of this plain
  // fallback — scoped to their own sandboxed iframe's own navigation, no
  // effect outside it.
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  if (redirectTo) {
    try {
      const url = new URL(redirectTo);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return NextResponse.redirect(url, { status: 303 });
      }
    } catch {
      // Malformed/unsupported URL — fall through to the plain success page.
    }
  }
  return htmlPage("Thank you!", "Your RSVP has been recorded.", 200);
}
