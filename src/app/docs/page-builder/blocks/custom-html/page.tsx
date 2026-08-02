import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Custom HTML/CSS/JS block",
  description: "Your own markup, styling, and script, rendered inside a sandboxed frame.",
  openGraph: { images: ["/docs/screenshots/block-custom-html-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-custom-html-properties.png"] },
};

export default function CustomHtmlBlockPage() {
  return (
    <DocsArticle
      title="Custom HTML/CSS/JS block"
      description="Your own markup, styling, and script, rendered inside a sandboxed frame."
      current="/docs/page-builder/blocks/custom-html"
    >
      <p>Your own markup, styling, and script, rendered inside a sandboxed frame.</p>
      <Screenshot
        src="block-custom-html-properties"
        alt="The Custom HTML block's Properties Panel with HTML, CSS, and JavaScript fields next to a live Preview pane"
        caption="The Preview pane on the right shows the sandboxed frame actually rendering the current HTML, CSS, and JS."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>HTML</strong> (<code>html</code>), <strong>CSS</strong> (<code>css</code>), and
          optional <strong>JavaScript</strong> (<code>js</code>).
        </li>
        <li>
          <strong>Frame height</strong> (<code>heightPx</code>) — in pixels.
        </li>
        <li>
          <strong>Reusable name</strong> (<code>reusableName</code>) — optional; naming it saves
          the snippet to your account-wide component library, referenceable from any block&rsquo;s
          HTML (any event) as <code>{'<custom-component name="..." />'}</code>, with any attribute
          on that tag available inside the snippet as a token.
        </li>
      </ul>
      <p>
        Two shortcodes work inside the HTML regardless of naming:{" "}
        <code>{"{{rsvp_form}}"}</code> and <code>{"{{venue_map}}"}</code>, which embed the real,
        working RSVP form or venue map so you can style them with your own CSS. See{" "}
        <Link href="/docs/page-builder/custom-code" className="text-accent hover:underline">
          custom code &amp; sandboxing
        </Link>{" "}
        for how the isolation actually works.
      </p>

      <DocsPrevNext current="/docs/page-builder/blocks/custom-html" />
    </DocsArticle>
  );
}
