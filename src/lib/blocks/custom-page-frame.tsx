import { buildSandboxSrcDoc } from "./sandbox";
import { applyComponentShortcodes, type ShortcodeContext } from "./shortcodes";

// The full escape hatch: renders the entire guest page as one sandboxed
// document instead of the block list. Same sandbox model as the per-block
// custom-html block (allow-scripts, no allow-same-origin — a unique opaque
// origin with no access to this site's cookies/storage/DOM), just sized to
// fill the viewport instead of one block's height. `shortcodes`, when
// given, lets the host write {{rsvp_form}}/{{venue_map}} in their HTML to
// embed the real, working components (see lib/blocks/shortcodes.ts).
export function CustomPageFrame({
  html,
  css,
  js,
  shortcodes,
}: {
  html: string;
  css: string;
  js: string;
  shortcodes?: ShortcodeContext;
}) {
  const resolvedHtml = shortcodes ? applyComponentShortcodes(html, shortcodes) : html;
  return (
    <iframe
      srcDoc={buildSandboxSrcDoc({ html: resolvedHtml, css, js })}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      title="Custom page"
      className="block h-dvh w-full border-0"
    />
  );
}
