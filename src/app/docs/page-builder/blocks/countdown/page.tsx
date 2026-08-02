import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Countdown block",
  description: "A live countdown to the event's own date and time — reach for it to build anticipation before the day itself.",
  openGraph: { images: ["/docs/screenshots/block-countdown-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-countdown-properties.png"] },
};

export default function CountdownBlockPage() {
  return (
    <DocsArticle
      title="Countdown block"
      description="A live countdown to the event's own date and time — reach for it to build anticipation before the day itself."
      current="/docs/page-builder/blocks/countdown"
    >
      <p>
        A live countdown to the event&rsquo;s own date and time (set on the Cover/hero block or in
        Settings) — days, hours, minutes, seconds, ticking down in the guest&rsquo;s browser.
      </p>
      <Screenshot
        src="block-countdown-properties"
        alt="The Countdown block's Properties Panel with a label field next to a live Preview pane"
        caption="The Preview pane on the right shows the live ticking countdown the current label sits above."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Label</strong> (<code>label</code>) — an optional line shown above the
          countdown (e.g. &ldquo;Counting down to&rdquo;).
        </li>
      </ul>
      <Callout>
        The countdown target itself isn&rsquo;t configured on this block at all — it always
        counts down to the event&rsquo;s own date and time, so changing the date in Settings
        (or on the hero block) updates every Countdown block on the page automatically.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/blocks/countdown" />
    </DocsArticle>
  );
}
