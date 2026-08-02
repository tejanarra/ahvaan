import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Layout controls",
  description: "Every block shares the same set of sizing, spacing, and per-device controls — learn them once, use them everywhere.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Layout controls")}&section=Guides`] },
  twitter: {
    card: "summary_large_image",
    images: [`/docs/og?title=${encodeURIComponent("Layout controls")}&section=Guides`],
  },
};

export default function LayoutControlsPage() {
  return (
    <DocsArticle
      title="Layout controls"
      description="Every block shares the same set of sizing, spacing, and per-device controls — learn them once, use them everywhere."
      current="/docs/page-builder/layout-controls"
    >
      <p>
        Select any block in the{" "}
        <Link href="/docs/page-builder" className="text-accent hover:underline">
          page builder
        </Link>{" "}
        and the properties panel shows a Layout section. It&rsquo;s the same set of controls no
        matter which block type you&rsquo;ve selected.
      </p>

      <h2>Align &amp; width</h2>
      <p>
        <strong>Align</strong> is left, center, or right — where the block&rsquo;s box sits on the
        page. <strong>Width</strong> is a preset cap on how wide that box gets: Small (300px),
        Medium (450px), Large (600px), or Full (no cap — stretches to the page&rsquo;s own width).
        Medium is the default for a new block.
      </p>
      <p>
        <strong>Minimum height</strong>, under Advanced options, is a floor, not a clip — a value
        here guarantees the block&rsquo;s box never renders shorter than that, but taller content
        (a long RSVP form, a big schedule) is never cut off to fit it.
      </p>

      <h2>Text color override</h2>
      <p>
        A block&rsquo;s own text already sets an explicit color drawn from the current theme, so a
        plain CSS <FileRef>color:</FileRef> in Custom CSS (below) can&rsquo;t override it — that
        theme color is more specific and always wins. The Text color control under Advanced options
        works differently: it redefines the underlying CSS custom property those theme colors
        actually read from for this block and everything nested inside it, so it overrides every
        descendant&rsquo;s text color without needing a separate setting per block type. Clear it to
        go back to following the theme.
      </p>

      <h2>Custom CSS</h2>
      <p>
        Also under Advanced options: a free-text box for raw <FileRef>property: value;</FileRef>{" "}
        declarations, applied straight to this one block&rsquo;s own wrapper as inline styles — not
        as a stylesheet. There are no selectors and nothing here can reach any other element on the
        page. The full safety story (and why that matters) lives on{" "}
        <Link href="/docs/page-builder/custom-code" className="text-accent hover:underline">
          Custom code &amp; sandboxing
        </Link>
        .
      </p>

      <h2>Row share &amp; grid span</h2>
      <p>
        <strong>Row share</strong> (labeled &ldquo;Row share&rdquo; in the panel) and{" "}
        <strong>grid span</strong> only appear, and only mean anything, when this block is a direct
        child of a Container block set to Row or Grid layout. Row share is a relative ratio among
        siblings — leaving it blank splits the row evenly, a number like 2 next to two default
        siblings gives this one half the row, and 0 opts out to size the block to its own content
        instead. Grid span is how many of the container&rsquo;s grid columns this block occupies. For
        a top-level block, or one inside a plain column stack, neither field is shown, since neither
        would do anything.
      </p>

      <h2>Per-device overrides</h2>
      <p>
        Open &ldquo;Per-device options&rdquo; to hide, resize, or realign this one block differently
        per device, without touching how it looks anywhere else:
      </p>
      <ul>
        <li>
          <strong>Hide on desktop</strong> hides it only at desktop width (1024px and up), leaving
          mobile and tablet alone — useful for something meant only for smaller screens.
        </li>
        <li>
          <strong>Mobile</strong> (up to 767px wide) can hide the block, or override its width/align
          for that width alone. Anything left unset falls back to the desktop settings above.
        </li>
        <li>
          <strong>Tablet</strong> (768&ndash;1023px) works the same way, but anything left unset
          there falls back to mobile&rsquo;s override first, then desktop &mdash; a tablet held
          upright is meant to default to looking like mobile with no extra setup, the same way one
          held sideways already defaults to looking like desktop.
        </li>
      </ul>
      <p>
        At least one of the three has to stay visible — once two are hidden, the panel disables the
        third checkbox so a block can&rsquo;t be hidden everywhere by accident.
      </p>

      <Callout title="Builder preview vs. the live guest page">
        On the real, published guest page, per-device overrides are enforced with genuine{" "}
        <FileRef>@media</FileRef> CSS, because the server has no way to know a visitor&rsquo;s actual
        viewport ahead of time. The builder canvas can&rsquo;t use a real media query for this — it
        would evaluate against your actual browser window, not the canvas&rsquo;s simulated device
        width — so the Desktop/Tablet/Mobile toggle in the canvas toolbar instead swaps the block
        layout directly based on which device you&rsquo;ve selected. Both paths read the same
        settings and agree on the same breakpoints, so what you see in each preview mode matches
        what that device sees live; there&rsquo;s just a different mechanism behind each one.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/layout-controls" />
    </DocsArticle>
  );
}
