import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Themes",
  description: "One preset for colors and fonts together — pick it once, nudge it later if you want.",
  openGraph: { images: ["/docs/screenshots/theme-picker.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/theme-picker.png"] },
};

export default function ThemesPage() {
  return (
    <DocsArticle
      title="Themes"
      description="One preset for colors and fonts together — pick it once, nudge it later if you want."
      current="/docs/themes"
    >
      <p>
        A theme is a paired set of colors and fonts applied to your guest-facing invite page. You
        choose one when you create an event, and can change it any time from the event&rsquo;s{" "}
        <strong>Settings</strong> tab — the same picker appears in both places.
      </p>
      <Screenshot src="theme-picker" alt="The theme picker showing preset color swatches and labels" />

      <h2>The 8 presets</h2>
      <ul>
        <li><strong>Classic Gold</strong> — warm amber accent on a soft neutral background.</li>
        <li><strong>Modern Minimal</strong> — clean black &amp; white with plenty of whitespace.</li>
        <li><strong>Playful Pastel</strong> — soft rose accent, friendly and light, great for parties.</li>
        <li><strong>Midnight Elegant</strong> — deep navy &amp; silver, formal and dramatic.</li>
        <li><strong>Garden Party</strong> — sage &amp; terracotta on cream, outdoor, brunch, alive.</li>
        <li><strong>Ocean Air</strong> — dusty blue on off-white, coastal and calm.</li>
        <li><strong>Fiesta</strong> — saturated coral &amp; marigold on warm white, loud parties.</li>
        <li><strong>Ink &amp; Blush</strong> — charcoal with a blush accent on white, editorial, chic.</li>
      </ul>

      <h2>Colors and fonts, together</h2>
      <p>
        Each theme bundles a color palette (background, foreground, accent, a darker accent for
        contrast, and a surface tone) with a matching display/body font pair — a serif paired with a
        clean sans, or a rounded display face with a soft body font, depending on the mood. Switching
        themes changes both at once, so your page always reads as one coherent look rather than a
        mismatched color-and-font combination.
      </p>

      <h2>Nudging a theme without switching it</h2>
      <p>
        If you like a theme&rsquo;s fonts but want a slightly different accent color, you don&rsquo;t
        have to change presets — the page builder lets you override individual colors on top of your
        chosen theme. See{" "}
        <Link href="/docs/page-builder/styling" className="text-accent hover:underline">
          styling in the page builder
        </Link>{" "}
        for how.
      </p>

      <Callout>
        Theme fonts only load on the guest-facing page (and in the builder&rsquo;s live preview) —
        the dashboard itself always uses its own interface font, regardless of which theme your event
        is set to. Switching themes, or having many events on different themes, never adds font
        weight to your own dashboard experience.
      </Callout>

      <DocsPrevNext current="/docs/themes" />
    </DocsArticle>
  );
}
