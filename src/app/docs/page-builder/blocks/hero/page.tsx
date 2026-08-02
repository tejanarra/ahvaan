import type { Metadata } from "next";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Cover / hero block",
  description: "The banner at the top of most invite pages — reach for it once, at the top of the page.",
  openGraph: { images: ["/docs/screenshots/block-hero-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-hero-properties.png"] },
};

export default function HeroBlockPage() {
  return (
    <DocsArticle
      title="Cover / hero block"
      description="The banner at the top of most invite pages — reach for it once, at the top of the page."
      current="/docs/page-builder/blocks/hero"
    >
      <p>
        The banner at the top of most invite pages: the event type label, title, subtitle, a
        date/venue line, and the description — all pulled directly from the event&rsquo;s own
        fields (Settings), not duplicated into the block&rsquo;s own config. Editing this
        block&rsquo;s title, subtitle, date, time, venue name, or description updates the event
        itself. Every new event already starts with one.
      </p>
      <Screenshot
        src="block-hero-properties"
        alt="The Hero block's Properties Panel with show/hide toggles next to a live Preview pane"
        caption="The Preview pane on the right always reflects exactly what's toggled on the left."
      />

      <h2>Settings</h2>
      <p>
        Its own config is just five independent show/hide toggles, each defaulting to on for a
        new hero block:
      </p>
      <ul>
        <li>
          <code>showEventType</code> — the small event-type label (e.g. &ldquo;Wedding&rdquo;)
          above the title.
        </li>
        <li>
          <code>showSubtitle</code> — the event&rsquo;s subtitle line below the title.
        </li>
        <li>
          <code>showTitle</code> — the event&rsquo;s title itself.
        </li>
        <li>
          <code>showVenueLine</code> — the date/venue summary line.
        </li>
        <li>
          <code>showDescription</code> — the event&rsquo;s longer description text.
        </li>
      </ul>
      <p>
        Toggling any of these off hides that piece of content on the guest page without deleting
        it from the event — turn it back on any time and the same text reappears, since none of
        it actually lives on the block.
      </p>

      <DocsPrevNext current="/docs/page-builder/blocks/hero" />
    </DocsArticle>
  );
}
