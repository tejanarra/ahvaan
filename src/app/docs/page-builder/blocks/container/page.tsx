import type { Metadata } from "next";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Container block",
  description: "A box that holds other blocks — the building block behind every starter layout.",
  openGraph: { images: ["/docs/screenshots/block-container-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-container-properties.png"] },
};

export default function ContainerBlockPage() {
  return (
    <DocsArticle
      title="Container block"
      description="A box that holds other blocks — the building block behind every starter layout."
      current="/docs/page-builder/blocks/container"
    >
      <p>
        A box that holds other blocks — the building block behind every starter layout. Reach for
        it whenever you need side-by-side content or a visually distinct section — most starter
        layouts and multi-column designs are just nested containers.
      </p>
      <Screenshot
        src="block-container-properties"
        alt="The Container block's Properties Panel with layout mode and spacing controls next to a live Preview pane"
        caption="The Preview pane on the right shows exactly how the current layout mode and spacing arrange the nested elements."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Layout</strong> (<code>layoutMode</code>) — Column, Row, or Grid: how nested
          elements are arranged.
        </li>
        <li>
          <strong>Background</strong> (<code>background</code>) and <strong>Padding</strong> (
          <code>paddingPx</code>).
        </li>
        <li>
          <strong>Gap between elements</strong> (<code>gapPx</code>).
        </li>
        <li>
          <strong>Grid columns</strong> (<code>gridColumns</code>) — Grid mode only.
        </li>
        <li>
          <strong>Distribute</strong> (<code>justify</code>) and <strong>Vertical align</strong> (
          <code>alignItems</code>) — how children spread out and cross-align; Row/Grid modes only.
        </li>
        <li>
          <strong>Custom CSS</strong> (<code>customStyle</code>) — styles the box itself
          (background, corners, shadow) — separate from the block-wide Layout → Custom CSS every
          block has, which positions the box on the page.
        </li>
      </ul>
      <p>
        An empty container just shows a placeholder note on the canvas until you add something to
        it.
      </p>

      <DocsPrevNext current="/docs/page-builder/blocks/container" />
    </DocsArticle>
  );
}
