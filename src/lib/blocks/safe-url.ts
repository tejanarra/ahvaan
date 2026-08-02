// Host-authored image/link URLs (block config, free text) have no scheme
// allowlist at the schema level (config is validated as a generic
// z.record, not per-field — see src/lib/schemas/page-schema.ts). Modern
// browsers don't execute `javascript:` via `<img src>`, so this isn't an
// active XSS vector today, but it's still unvalidated input reaching a
// guest's browser — this constrains it to what a legitimate image/link
// value should ever be (an absolute http(s) URL, or a same-origin
// relative path/upload), closing off `data:`/`javascript:`/other schemes
// as a defense-in-depth measure.
export function safeImageSrc(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return undefined;
}
