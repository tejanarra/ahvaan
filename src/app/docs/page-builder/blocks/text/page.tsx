import type { Metadata } from "next";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Text block",
  description: "A block of your own copy — from a paragraph of story to a section heading.",
  openGraph: { images: ["/docs/screenshots/block-text-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-text-properties.png"] },
};

export default function TextBlockPage() {
  return (
    <DocsArticle
      title="Text block"
      description="A block of your own copy — from a paragraph of story to a section heading."
      current="/docs/page-builder/blocks/text"
    >
      <p>
        A block of your own copy. Use it for anything from a paragraph of story to a section
        heading.
      </p>
      <Screenshot
        src="block-text-properties"
        alt="The Text block's Properties Panel with body, style, and color fields next to a live Preview pane"
        caption="The Preview pane on the right renders exactly the style and color chosen on the left."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Text</strong> (<code>body</code>) — the copy itself.
        </li>
        <li>
          <strong>Style</strong> (<code>variant</code>) — Body, Subheading, Heading, or Title.
          Heading and Title switch to the site&rsquo;s display serif at a distinctly larger size,
          not just bigger body text.
        </li>
        <li>
          <strong>Color</strong> (<code>color</code>) — an optional override; left unset, it
          falls back to the current theme&rsquo;s foreground color.
        </li>
      </ul>

      <DocsPrevNext current="/docs/page-builder/blocks/text" />
    </DocsArticle>
  );
}
