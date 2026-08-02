import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Styling",
  description: "Every styling control in the builder, in one place — from one block's own box up to the whole page's palette.",
  openGraph: { images: ["/docs/screenshots/theme-picker.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/theme-picker.png"] },
};

export default function StylingPage() {
  return (
    <DocsArticle
      title="Styling"
      description="Every styling control in the builder, in one place — from one block's own box up to the whole page's palette."
      current="/docs/page-builder/styling"
    >
      <p>
        Styling in the page builder happens at three scopes, from narrowest to widest: a{" "}
        <strong>selected block</strong>, the <strong>page</strong> as a whole, and nothing beyond
        that — there&rsquo;s no separate &ldquo;theme editor,&rdquo; only a page-level override on top of
        whichever theme the event uses. Today these live behind a few different buttons rather than
        one unified panel; a future pass is planned to bring them under a single &ldquo;Style&rdquo;
        panel with Theme/Page/Selected-block tabs, but that&rsquo;s a presentation change only —
        every control described below already exists and works.
      </p>

      <h2>Selected block: Custom CSS</h2>
      <p>
        Select any block and its properties panel has a Custom CSS field under Advanced options
        (Container blocks call the same field &ldquo;Custom style&rdquo; instead). Both are raw{" "}
        <FileRef>property: value;</FileRef> text, parsed into an inline style object and applied
        directly to that one block&rsquo;s wrapper — never as a <FileRef>&lt;style&gt;</FileRef>{" "}
        stylesheet, so there are no selectors and nothing here can reach any other element on the
        page. See{" "}
        <Link href="/docs/page-builder/layout-controls" className="text-accent hover:underline">
          layout controls
        </Link>{" "}
        for the rest of what lives alongside it (align, width, per-device overrides), and{" "}
        <Link href="/docs/page-builder/custom-code" className="text-accent hover:underline">
          Custom code &amp; sandboxing
        </Link>{" "}
        for the full safety story behind letting hosts write raw code at all.
      </p>

      <h2>Page: theme colors, font, and page CSS</h2>
      <p>
        With nothing selected, click <strong>Page settings</strong> in the builder&rsquo;s top bar
        to reach page-wide styling:
      </p>
      <ul>
        <li>
          <strong>Theme colors</strong> lets you nudge individual colors — background, text,
          accent, accent (dark), and surface — away from the event&rsquo;s chosen theme, without
          switching to a whole different theme. Leave any color alone and it keeps following the
          theme; a &ldquo;Reset to theme defaults&rdquo; link clears every override at once.
        </li>
        <li>
          <strong>Font</strong> is a small preset list (Default, Serif, Mono, Rounded) applied as a
          real <FileRef>font-family</FileRef> to the page root.
        </li>
        <li>
          <strong>Page CSS</strong> is the same raw-text-to-inline-style mechanism as a block&rsquo;s
          Custom CSS, but applied to the page&rsquo;s own root element instead of one block&rsquo;s
          wrapper — this is the tool for whole-page layout, like arranging blocks in a row or
          setting a page-wide background, since no single block owns that.
        </li>
      </ul>
      <p>
        The event&rsquo;s overall <strong>theme</strong> itself (which of the built-in themes an
        event uses) is chosen separately, from the swatch button next to Page settings in the same
        top bar.
      </p>
      <Screenshot src="theme-picker" alt="The builder's top bar with the theme swatch button open" />

      <Callout title="Where each field is stored">
        These map directly to real fields on the page&rsquo;s saved schema: theme color nudges are{" "}
        <FileRef>themeOverrides</FileRef>, the font choice is <FileRef>fontFamily</FileRef>, and page
        CSS is <FileRef>pageStyle</FileRef> — all separate from the event&rsquo;s own{" "}
        <FileRef>theme_id</FileRef>, which is what the top-bar swatch button changes.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/styling" />
    </DocsArticle>
  );
}
