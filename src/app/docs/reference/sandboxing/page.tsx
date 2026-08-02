import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "The sandboxing model",
  description: "How host-authored HTML/CSS/JS runs without ever becoming a way to attack this site or another host's page.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("The sandboxing model")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("The sandboxing model")}&section=Reference`] },
};

export default function SandboxingReferencePage() {
  return (
    <DocsArticle
      title="The sandboxing model"
      description="How host-authored HTML/CSS/JS runs without ever becoming a way to attack this site or another host's page."
      current="/docs/reference/sandboxing"
    >
      <p>
        Two surfaces let a host write raw HTML/CSS/JS: the custom-html block (
        <FileRef>src/lib/blocks/blocks/custom-html.tsx</FileRef>) and the whole-page escape hatch (
        <FileRef>src/lib/blocks/custom-page-frame.tsx</FileRef>). Both build their document with
        the same function and render it into an iframe with the same sandbox attribute — there is
        exactly one place this trust boundary is defined.
      </p>

      <h2>buildSandboxSrcDoc</h2>
      <p>
        <FileRef>buildSandboxSrcDoc</FileRef> (<FileRef>src/lib/blocks/sandbox.ts:27</FileRef>)
        inlines the host&rsquo;s html/css/js into one document with no external script or
        stylesheet loading exposed — nothing here can reach a third-party origin. Before
        inlining, it runs the host&rsquo;s css and js through{" "}
        <FileRef>escapeClosingTags</FileRef> (<FileRef>src/lib/blocks/sandbox.ts:8</FileRef>),
        which rewrites a literal <FileRef>&lt;/style</FileRef> or <FileRef>&lt;/script</FileRef>{" "}
        inside the host&rsquo;s own content to <FileRef>&lt;\/style</FileRef>/
        <FileRef>&lt;\/script</FileRef> so it can&rsquo;t early-close the tag it&rsquo;s embedded in
        and get dumped into the page as inert text. This is a correctness fix for the host&rsquo;s
        own snippet, not a trust-boundary fix — the content is still the host&rsquo;s own code
        inside their own already-sandboxed iframe either way.
      </p>

      <h2>The iframe boundary</h2>
      <p>
        Both call sites render with <FileRef>sandbox=&quot;allow-scripts&quot;</FileRef> and
        nothing else — <FileRef>allow-same-origin</FileRef> is never set. Confirmed at both:{" "}
        <FileRef>src/lib/blocks/blocks/custom-html.tsx:112</FileRef> (the per-block frame) and{" "}
        <FileRef>src/lib/blocks/custom-page-frame.tsx:39</FileRef> (the whole-page frame).
      </p>

      <Callout title="The one sentence that matters">
        <FileRef>allow-scripts</FileRef> without <FileRef>allow-same-origin</FileRef> means the
        frame gets a unique opaque origin on every render, with no access to this site&rsquo;s
        cookies, localStorage, or the parent window&rsquo;s DOM — scripts run, but they run
        somewhere that can&rsquo;t reach anything worth attacking.
      </Callout>

      <h2>CSS elsewhere never becomes a &lt;style&gt; tag</h2>
      <p>
        Outside the sandboxed iframe, a host can style things too — a block&rsquo;s{" "}
        <FileRef>customCss</FileRef>, a container&rsquo;s <FileRef>customStyle</FileRef>, and a
        page&rsquo;s own <FileRef>pageStyle</FileRef> (<FileRef>src/lib/blocks/types.ts:31</FileRef>
        , <FileRef>src/lib/blocks/types.ts:282</FileRef>, and{" "}
        <FileRef>src/lib/blocks/types.ts:311</FileRef>). None of these are ever injected as a raw{" "}
        <FileRef>&lt;style&gt;</FileRef> tag in the real (non-sandboxed) document — that would let
        arbitrary selectors reach outside the one element they&rsquo;re meant to style. Instead
        each is parsed by <FileRef>parseInlineStyle</FileRef> (
        <FileRef>src/lib/blocks/layout-controls.tsx:36</FileRef>) into a plain inline style object
        with no selectors, applied only to that one element&rsquo;s own box.
      </p>

      <h2>CSP-nonce inheritance</h2>
      <p>
        A <FileRef>srcDoc</FileRef> iframe with no CSP of its own inherits its creator
        document&rsquo;s policy verbatim — per the CSP3 spec&rsquo;s &ldquo;Inherit a Policy&rdquo;
        behavior — including any nonce source on <FileRef>script-src</FileRef>. This app moved off
        a blanket <FileRef>&apos;unsafe-inline&apos;</FileRef> to a per-request nonce (
        <FileRef>src/proxy.ts:39</FileRef> generates it and stamps it onto both the CSP response
        header and a forwarded <FileRef>x-nonce</FileRef> request header, built into the policy
        string at <FileRef>src/proxy.ts:26</FileRef>). Server Components read it back through{" "}
        <FileRef>getCspNonce</FileRef> (<FileRef>src/lib/csp-nonce.ts:12</FileRef>), and{" "}
        <FileRef>buildSandboxSrcDoc</FileRef> stamps that same nonce onto the host&rsquo;s own
        inline <FileRef>&lt;script&gt;</FileRef> (<FileRef>src/lib/blocks/sandbox.ts:30</FileRef>).
        Without it, the srcDoc frame&rsquo;s inherited strict <FileRef>script-src</FileRef> would
        block the host&rsquo;s own script exactly as it would an untrusted injected one. Callers
        with no script content (e.g. post-submit confirmation frames that only ever pass{" "}
        <FileRef>js: &quot;&quot;</FileRef>) can omit the nonce — an empty script body has nothing
        to block either way.
      </p>

      <DocsPrevNext current="/docs/reference/sandboxing" />
    </DocsArticle>
  );
}
