import type { Metadata } from "next";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Image carousel block",
  description: "A slideshow of multiple photos — a gallery without stacking a dozen Image blocks down the page.",
  openGraph: { images: ["/docs/screenshots/block-carousel-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-carousel-properties.png"] },
};

export default function CarouselBlockPage() {
  return (
    <DocsArticle
      title="Image carousel block"
      description="A slideshow of multiple photos — a gallery without stacking a dozen Image blocks down the page."
      current="/docs/page-builder/blocks/carousel"
    >
      <p>
        A slideshow of multiple photos. Reach for it for a photo gallery without stacking a dozen
        separate Image blocks down the page.
      </p>
      <Screenshot
        src="block-carousel-properties"
        alt="The Carousel block's Properties Panel with slide list, arrows, dots, and autoplay controls next to a live Preview pane"
        caption="The Preview pane on the right shows exactly which slide, arrows, and dots the current settings produce."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Slides</strong> (<code>images</code>) — an ordered list of slides, each with its
          own image, alt text, and optional per-slide max height/fit — same controls as the single
          Image block, so one unusually-shaped photo can be capped without affecting the others.
        </li>
        <li>
          <strong>Show prev/next arrows</strong> (<code>showArrows</code>).
        </li>
        <li>
          <strong>Show dot indicators</strong> (<code>showDots</code>).
        </li>
        <li>
          <strong>Auto-advance</strong> (<code>autoplay</code>) — with a configurable
          seconds-per-slide interval (<code>intervalMs</code>) once enabled.
        </li>
      </ul>

      <DocsPrevNext current="/docs/page-builder/blocks/carousel" />
    </DocsArticle>
  );
}
