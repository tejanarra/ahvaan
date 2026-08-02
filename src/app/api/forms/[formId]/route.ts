import { NextResponse } from "next/server";
import { submitCustomFormFromFormData, verifyFormSubmissionCode } from "@/lib/form-submit";

// Public, unauthenticated write endpoint — mirrors src/app/api/rsvp/route.ts
// exactly (same rationale: Server Actions can't be posted to from inside a
// sandboxed opaque-origin iframe, a plain form POST has no such
// restriction, so this is what makes "embed a working form in a
// custom-HTML block" possible). The form id is the real access control —
// see lib/form-submit.ts, which resolves host_id/event_id from the forms
// row itself, never from client input.
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

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const formData = await request.formData();
  formData.set("formId", formId);
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  // See the matching comment in src/app/api/rsvp/route.ts — a hand-embedded
  // HTML form has no client JS to hold state between requests, so the
  // code-entry follow-up form posts back to this same endpoint with these
  // two fields instead of the form's real fields.
  const otpVerificationId = String(formData.get("otpVerificationId") ?? "").trim();
  const otpCode = String(formData.get("otpCode") ?? "").trim();
  const result = otpVerificationId
    ? await verifyFormSubmissionCode(otpVerificationId, otpCode)
    : await submitCustomFormFromFormData(formData);

  if (result.status === "error") {
    if (wantsJson) return NextResponse.json({ ok: false, error: result.message, fieldErrors: result.fieldErrors }, { status: 400 });
    return htmlPage("Response not saved", escapeHtml(result.message), 400);
  }

  if (result.status === "verification_sent") {
    if (wantsJson) {
      return NextResponse.json({ ok: true, verificationRequired: true, verificationId: result.verificationId, email: result.email });
    }
    return htmlPage(
      "Check your email",
      `We sent a verification code to ${escapeHtml(result.email)}. Enter it below to finish your response.` +
        `<form method="post" style="margin-top:1.5rem;display:flex;gap:0.5rem;justify-content:center;">` +
        `<input type="hidden" name="otpVerificationId" value="${escapeHtml(result.verificationId)}" />` +
        `<input type="text" name="otpCode" placeholder="6-digit code" required style="padding:0.5rem;font-size:1rem;" />` +
        `<button type="submit" style="padding:0.5rem 1rem;">Verify</button>` +
        `</form>`,
      200
    );
  }

  if (wantsJson) return NextResponse.json({ ok: true, responses: result.responses });

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
  return htmlPage("Thank you!", "Your response has been recorded.", 200);
}
