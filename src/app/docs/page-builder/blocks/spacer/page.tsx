import type { Metadata } from "next";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Spacer block",
  description: "Invisible vertical space between two other blocks.",
  openGraph: { images: ["/docs/screenshots/block-spacer-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-spacer-properties.png"] },
};

export default function SpacerBlockPage() {
  return (
    <DocsArticle
      title="Spacer block"
      description="Invisible vertical space between two other blocks."
      current="/docs/page-builder/blocks/spacer"
    >
      <p>
        Invisible vertical space between two other blocks. Use it to open up breathing room the
        blocks&rsquo; own default spacing doesn&rsquo;t give you.
      </p>
      <Screenshot
        src="block-spacer-properties"
        alt="The Spacer block's Properties Panel with a height field next to a live Preview pane"
        caption="The Preview pane on the right shows exactly how much room the current height in pixels opens up."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Height</strong> (<code>heightPx</code>) — the only field, in pixels.
        </li>
      </ul>

      <DocsPrevNext current="/docs/page-builder/blocks/spacer" />
    </DocsArticle>
  );
}
