// Shared by the custom-html block and the page-level "complete custom page"
// mode — inlines html/css/js into one document with no external script/
// stylesheet loading exposed, so there's no way to pull in third-party
// origins from either surface.
export function buildSandboxSrcDoc(config: { html: string; css: string; js: string }) {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${config.css}</style></head><body>${config.html}<script>${config.js}<\/script></body></html>`;
}
