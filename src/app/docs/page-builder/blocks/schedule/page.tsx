import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Schedule / itinerary block",
  description: "A run-of-show list — ceremony, reception, and anything in between.",
  openGraph: { images: ["/docs/screenshots/block-schedule-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-schedule-properties.png"] },
};

export default function ScheduleBlockPage() {
  return (
    <DocsArticle
      title="Schedule / itinerary block"
      description="A run-of-show list — ceremony, reception, and anything in between."
      current="/docs/page-builder/blocks/schedule"
    >
      <p>A run-of-show list — ceremony, reception, and anything in between.</p>
      <Screenshot
        src="block-schedule-properties"
        alt="The Schedule block's Properties Panel showing layout presets and items next to a live Preview pane"
        caption="The Preview pane on the right renders the exact layout preset and items configured on the left."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Heading</strong> (<code>heading</code>) — optional.
        </li>
        <li>
          <strong>Items</strong> (<code>items</code>) — an ordered list, each with an optional{" "}
          <strong>Time</strong>, a <strong>Label</strong>, and an optional{" "}
          <strong>Description</strong>.
        </li>
        <li>
          <strong>Layout</strong> — five one-click presets combine the underlying{" "}
          <strong>style</strong> (<code>style</code>: Timeline, Cards, or Minimal),{" "}
          <strong>direction</strong> (<code>direction</code>: Vertical or Horizontal),{" "}
          <strong>text alignment</strong> (<code>align</code>), and <strong>gap</strong> (
          <code>gapPx</code>) settings into ready-made looks — Simple list, Elegant timeline,
          Side-by-side cards, Minimal, and Horizontal timeline. An &ldquo;Advanced layout
          options&rdquo; section exposes each of those four settings individually for a one-off
          nudge.
        </li>
      </ul>
      <Callout>
        On the guest page, items are always sorted by their parsed time regardless of the order
        you entered them in; items with no time (or an unparseable one) are appended at the end.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/blocks/schedule" />
    </DocsArticle>
  );
}
