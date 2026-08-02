// Guards the two public, unauthenticated form-POST route handlers
// (src/app/api/rsvp/route.ts, src/app/api/forms/[formId]/route.ts) against
// an oversized request body before it's ever buffered into memory by
// `request.formData()`. Everything past this point already gets a real
// content check (src/lib/schemas/size-budget.ts's 64KB payload cap), but
// that only runs *after* the full body is parsed — a large multipart body
// (many duplicate fields, one huge field) would otherwise consume memory/
// CPU before any of that validation fires. Server Actions get a default
// 1MB cap from Next itself; plain Route Handlers don't, so this is the
// equivalent guard for these two.
//
// `Content-Length` isn't guaranteed to be present (e.g. chunked transfer
// encoding), so this is defense-in-depth on top of, not a replacement for,
// the size-budget check downstream — a request with no declared length
// still reaches `formData()` and gets caught there instead.
const MAX_REQUEST_BYTES = 256 * 1024;

export function isRequestTooLarge(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > MAX_REQUEST_BYTES;
}
