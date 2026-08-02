import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Image block",
  description: "A single photo, sized and cropped exactly as much as you choose to.",
  openGraph: { images: ["/docs/screenshots/block-image-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-image-properties.png"] },
};

export default function ImageBlockPage() {
  return (
    <DocsArticle
      title="Image block"
      description="A single photo, sized and cropped exactly as much as you choose to."
      current="/docs/page-builder/blocks/image"
    >
      <p>A single photo, uploaded through the event&rsquo;s own image library.</p>
      <Screenshot
        src="block-image-properties"
        alt="The Image block's Properties Panel with max height and fit fields next to a live Preview pane"
        caption="The Preview pane on the right shows exactly how the current max height and fit settings crop or scale the photo."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Image</strong> (<code>url</code>) — the photo itself, uploaded through the
          event&rsquo;s own image library.
        </li>
        <li>
          <strong>Alt text</strong> (<code>alt</code>) — for screen readers.
        </li>
        <li>
          <strong>Max height</strong> (<code>maxHeightPx</code>) — an optional cap in pixels.
        </li>
        <li>
          <strong>Fit</strong> (<code>fit</code>) — only shown once a max height is set: whether a
          taller image <strong>fills &amp; crops</strong> (<code>cover</code>) to that height or{" "}
          <strong>fits with no crop</strong> (<code>contain</code>, scales the whole image down to
          stay fully visible).
        </li>
      </ul>
      <Callout>
        Leave the max height blank to keep the image at its natural size and aspect ratio — the
        fit toggle only appears once a cap is set.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/blocks/image" />
    </DocsArticle>
  );
}
