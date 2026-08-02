import { headers } from "next/headers";

// The per-request nonce src/proxy.ts stamps onto both the CSP response
// header and this forwarded request header — Server Components that need
// to nonce an inline script they render themselves (currently: the
// sandboxed custom-code iframes, which inherit the parent document's CSP
// for their srcdoc content per spec) read it back through here. Empty
// string outside a real request (e.g. if ever called during a build-time
// static path) rather than throwing — callers treat "" as "no nonce
// available", which only matters for routes that opted into force-dynamic
// anyway (every route that renders a custom-code block already is).
export async function getCspNonce(): Promise<string> {
  const h = await headers();
  return h.get("x-nonce") ?? "";
}
