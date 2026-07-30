import { NextResponse } from "next/server";
import { submitRsvpFromFormData } from "@/lib/rsvp-submit";

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
  const formData = await request.formData();
  const result = await submitRsvpFromFormData(formData);
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  if (result.status === "error") {
    if (wantsJson) return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
    return htmlPage("RSVP not saved", escapeHtml(result.message), 400);
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
