import { buildSandboxSrcDoc } from "./sandbox";

// The full escape hatch: renders the entire guest page as one sandboxed
// document instead of the block list. Same sandbox model as the per-block
// custom-html block (allow-scripts, no allow-same-origin — a unique opaque
// origin with no access to this site's cookies/storage/DOM), just sized to
// fill the viewport instead of one block's height.
export function CustomPageFrame({ html, css, js }: { html: string; css: string; js: string }) {
  return (
    <iframe
      srcDoc={buildSandboxSrcDoc({ html, css, js })}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      title="Custom page"
      className="block h-dvh w-full border-0"
    />
  );
}
