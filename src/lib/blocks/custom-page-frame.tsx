import { buildSandboxSrcDoc } from "./sandbox";
import { applyComponentShortcodes, type ShortcodeContext } from "./shortcodes";

// The full escape hatch: renders the entire guest page as one sandboxed
// document instead of the block list. Same sandbox model as the per-block
// custom-html block (allow-scripts, no allow-same-origin — a unique opaque
// origin with no access to this site's cookies/storage/DOM), just sized to
// fill the viewport instead of one block's height. `shortcodes`, when
// given, lets the host write {{rsvp_form}}/{{venue_map}} in their HTML to
// embed the real, working components (see lib/blocks/shortcodes.ts).
//
// `nonce`: only the real guest page (a Server Component) has one to give —
// see src/lib/csp-nonce.ts's comment on why this can't be fetched in here
// directly (this component is also imported by the dashboard builder's
// client-side live preview, which can't use next/headers).
export function CustomPageFrame({
  html,
  css,
  js,
  shortcodes,
  nonce,
}: {
  html: string;
  css: string;
  js: string;
  shortcodes?: ShortcodeContext;
  nonce?: string;
}) {
  // Folds `nonce` into the shortcode context here rather than requiring
  // every caller to duplicate it in both places — a <custom-component>'s
  // own <script> (substituted by applyComponentShortcodes, before this
  // function's own buildSandboxSrcDoc call below ever sees it) needs the
  // same nonce buildSandboxSrcDoc stamps on the page's own <script>, or it
  // gets silently blocked by the sandboxed iframe's inherited CSP.
  const resolvedHtml = shortcodes ? applyComponentShortcodes(html, { ...shortcodes, nonce }) : html;
  return (
    <iframe
      srcDoc={buildSandboxSrcDoc({ html: resolvedHtml, css, js }, nonce)}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      title="Custom page"
      className="block h-dvh w-full border-0"
    />
  );
}
