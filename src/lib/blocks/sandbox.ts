// Host-authored css/js can legitimately contain the literal text
// "</style"/"</script>" (e.g. a JS string, a CSS comment) — left
// unescaped, that text would early-close the tag it's embedded in and get
// dumped into the document as plain text instead of executing, breaking
// the host's own snippet. Doesn't cross the sandbox's trust boundary
// (still the host's own code inside their own already-sandboxed iframe),
// but is worth guarding against as a correctness fix.
function escapeClosingTags(source: string, tag: "style" | "script") {
  return source.replace(new RegExp(`</(${tag})`, "gi"), "<\\/$1");
}

// Shared by the custom-html block and the page-level "complete custom page"
// mode — inlines html/css/js into one document with no external script/
// stylesheet loading exposed, so there's no way to pull in third-party
// origins from either surface.
//
// `nonce`: a `srcdoc` iframe with no CSP of its own inherits its creator
// document's policy verbatim (CSP3 §"Inherit a Policy"), including any
// nonce source on script-src — so once the parent page moved off a blanket
// `'unsafe-inline'` to a per-request nonce (src/proxy.ts, docs-audit M3),
// the host's own inline `<script>` here needs that exact nonce stamped on
// it, or the inherited policy blocks it just like it would an untrusted
// injected script in the parent document. Callers with no script content
// to run (e.g. the RSVP/form post-submit `custom_html` confirmation
// frames, which only ever pass `js: ""`) can omit it — an empty script
// body has nothing to block either way.
export function buildSandboxSrcDoc(config: { html: string; css: string; js: string }, nonce?: string) {
  const css = escapeClosingTags(config.css, "style");
  const js = escapeClosingTags(config.js, "script");
  const scriptTag = nonce ? `<script nonce="${nonce}">` : "<script>";
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body>${config.html}${scriptTag}${js}<\/script></body></html>`;
}
