import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "The page builder — overview & blocks",
  description: "Every block type you can drop onto an invite page, and what each one actually renders.",
  openGraph: { images: ["/docs/screenshots/page-builder-overview.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/page-builder-overview.png"] },
};

const BLOCK_LINKS = [
  { label: "Cover / hero", href: "/docs/page-builder/blocks/hero", blurb: "The banner at the top of the page." },
  { label: "Text", href: "/docs/page-builder/blocks/text", blurb: "A block of your own copy." },
  { label: "Image", href: "/docs/page-builder/blocks/image", blurb: "A single photo." },
  { label: "Image carousel", href: "/docs/page-builder/blocks/carousel", blurb: "A slideshow of multiple photos." },
  { label: "Spacer", href: "/docs/page-builder/blocks/spacer", blurb: "Invisible vertical space." },
  { label: "Countdown", href: "/docs/page-builder/blocks/countdown", blurb: "A live countdown to the event." },
  { label: "Schedule / itinerary", href: "/docs/page-builder/blocks/schedule", blurb: "A run-of-show list." },
  { label: "RSVP form", href: "/docs/page-builder/blocks/rsvp-form", blurb: "The form guests respond with." },
  { label: "Form", href: "/docs/page-builder/blocks/form", blurb: "Embeds one of your saved custom forms." },
  { label: "Venue map", href: "/docs/page-builder/blocks/venue-map", blurb: "An embedded map for the venue." },
  { label: "Custom HTML/CSS/JS", href: "/docs/page-builder/blocks/custom-html", blurb: "Your own markup, in a sandbox." },
  { label: "Container", href: "/docs/page-builder/blocks/container", blurb: "A box that holds other blocks." },
];

export default function PageBuilderOverviewPage() {
  return (
    <DocsArticle
      title="The page builder — overview & blocks"
      description="Every block type you can drop onto an invite page, and what each one actually renders."
      current="/docs/page-builder"
    >
      <p>
        Every event has its own invite page, built from a list of <strong>blocks</strong> — a hero,
        text, an RSVP form, and so on. Open it from the event&rsquo;s <strong>Invite page</strong>{" "}
        tab: the left panel is the component palette, the middle is a live canvas of the page as
        guests will see it, and clicking any block opens its own Properties Panel on the right.
      </p>
      <Screenshot src="page-builder-overview" alt="The page builder canvas with the component palette open on the left" />

      <h2>Adding, moving, and removing blocks</h2>
      <p>
        Every palette card works two ways: click it to append that block to the end of the page,
        or drag it onto the canvas to drop it at a precise spot — including directly onto a{" "}
        <Link href="/docs/page-builder/layout-controls" className="text-accent hover:underline">
          container
        </Link>{" "}
        to nest it inside. Existing blocks on the canvas can be dragged the same way to reorder
        them. Select a block to see its Properties Panel; every panel follows the same shape —
        content fields at the top, layout and styling controls further down (see{" "}
        <Link href="/docs/page-builder/layout-controls" className="text-accent hover:underline">
          layout controls
        </Link>{" "}
        and <Link href="/docs/page-builder/styling" className="text-accent hover:underline">styling</Link>).
      </p>
      <Screenshot src="page-builder-properties-panel" alt="A block's Properties Panel open on the right side of the builder" />

      <h2>Starter layouts</h2>
      <p>
        The palette&rsquo;s <strong>Layout</strong> section offers three one-click starting points:{" "}
        <strong>Single section</strong> (one full-width container), <strong>2 columns</strong>, and{" "}
        <strong>3 columns</strong> (a grid container holding two or three empty containers
        side by side). Each is just a pre-built container tree, not a locked template — once it&rsquo;s
        on the page, every piece of it (the outer grid, each nested container, anything you drop
        inside) is a completely ordinary block you can edit, rearrange, or delete like any other.
      </p>

      <h2>Blocks</h2>
      <p>
        Each block type has its own page below with every configurable field and a screenshot
        showing its Properties Panel next to a live Preview of the result:
      </p>
      <div className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BLOCK_LINKS.map((block) => (
          <Link key={block.href} href={block.href} className="block">
            <Card className="h-full px-4 py-3 transition-colors hover:border-accent">
              <p className="text-sm font-semibold text-foreground">{block.label}</p>
              <p className="mt-1 text-sm text-muted">{block.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2>Device preview and the raw JSON escape hatch</h2>
      <p>
        A Desktop/Tablet/Mobile toggle in the toolbar re-renders the canvas at each device&rsquo;s
        real width, so you can check a layout before publishing without leaving the builder. For
        anything the visual builder doesn&rsquo;t expose a knob for, the <strong>Code</strong>{" "}
        button swaps the canvas for the page&rsquo;s underlying JSON schema — the same data the
        visual builder edits, as text. It&rsquo;s a manual round-trip, not a live sync: edits stay
        local until you click Apply (or Revert to discard them), and it&rsquo;s a power-user
        fallback, not a required step — everything described above is reachable without ever
        opening it.
      </p>
      <Screenshot src="page-json-editor" alt="The raw JSON page schema editor" />

      <DocsPrevNext current="/docs/page-builder" />
    </DocsArticle>
  );
}
