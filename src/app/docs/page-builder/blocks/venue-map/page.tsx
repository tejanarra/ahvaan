import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Venue map block",
  description: "An embedded map for the event's venue — the one truly zero-configuration block on the page.",
  openGraph: { images: ["/docs/screenshots/block-venue-map-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-venue-map-properties.png"] },
};

export default function VenueMapBlockPage() {
  return (
    <DocsArticle
      title="Venue map block"
      description="An embedded map for the event's venue — the one truly zero-configuration block on the page."
      current="/docs/page-builder/blocks/venue-map"
    >
      <p>An embedded map for the event&rsquo;s venue.</p>
      <Screenshot
        src="block-venue-map-properties"
        alt="The Venue map block's empty Properties Panel next to a live Preview pane showing the rendered map"
        caption="The Preview pane on the right shows the map even though the panel on the left has nothing to configure — it's reading straight from Settings."
      />

      <h2>Settings</h2>
      <p>
        This block has no configurable fields at all — it reads the venue name and address
        straight from the event&rsquo;s own Settings, so editing the venue there updates the map
        everywhere it&rsquo;s used. If the event has no venue address set, the block simply
        renders nothing.
      </p>
      <Callout>
        The Venue map block is the one truly zero-configuration block on the page — there&rsquo;s
        nothing to set in its Properties Panel because it always mirrors the event&rsquo;s own
        venue name and address. Move the event, update it once in Settings, and every Venue map
        block across the page picks it up automatically.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/blocks/venue-map" />
    </DocsArticle>
  );
}
