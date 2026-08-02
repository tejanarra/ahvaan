import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Custom code & sandboxing",
  description: "Write your own HTML, CSS, and JavaScript — at one block, or for the whole page — safely.",
  openGraph: { images: ["/docs/screenshots/block-custom-html-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-custom-html-properties.png"] },
};

export default function CustomCodePage() {
  return (
    <DocsArticle
      title="Custom code & sandboxing"
      description="Write your own HTML, CSS, and JavaScript — at one block, or for the whole page — safely."
      current="/docs/page-builder/custom-code"
    >
      <p>
        For anything the built-in blocks don&rsquo;t cover, you can write your own HTML, CSS, and
        JavaScript directly. There are two ways to reach for it:
      </p>
      <ul>
        <li>
          <strong>A Custom HTML block</strong>, added like any other block, styled and scripted on
          its own, sized to a height you set.
        </li>
        <li>
          <strong>A whole custom page</strong>, turned on from Page settings &rsquo; &ldquo;Complete
          custom page&rdquo; &mdash; replaces the entire block list with your own HTML/CSS/JS
          document. Your blocks aren&rsquo;t deleted while this is on, just ignored; turn it back off
          and they&rsquo;re still there.
        </li>
      </ul>
      <Screenshot src="block-custom-html-properties" alt="A Custom HTML block's properties panel with HTML, CSS, and JavaScript fields" />

      <h2>Why it&rsquo;s safe</h2>
      <p>
        Your code doesn&rsquo;t run on the page itself — it runs inside its own isolated frame,
        sandboxed so it can execute JavaScript but has no access to anything outside its own box: no
        reading cookies, no reaching the rest of the site, no seeing any other data on the page
        around it. It&rsquo;s the same isolation whether it&rsquo;s one Custom HTML block or a whole
        custom page.
      </p>

      <Callout>
        Your code can&rsquo;t see anyone else&rsquo;s data — not other guests&rsquo; RSVPs, not your
        own account details, and not anything from other events on your account, even ones you own.
        The frame it runs in has no way to reach any of that.
      </Callout>

      <p>
        Want the technical detail — the exact sandbox attribute, why it&rsquo;s safe, how the CSP
        nonce threads through? See{" "}
        <Link href="/docs/reference/sandboxing" className="text-accent hover:underline">
          the sandboxing model
        </Link>{" "}
        in the reference section.
      </p>

      <h2>Embedding the real RSVP form or venue map</h2>
      <p>
        Write <FileRef>{"{{rsvp_form}}"}</FileRef> or <FileRef>{"{{venue_map}}"}</FileRef> anywhere
        in your HTML and it&rsquo;s swapped out for the real, working RSVP form or venue map before
        your code runs — not a mockup. Style it however you like with your own CSS; the form still
        submits real RSVPs and the map still points at the actual venue.
      </p>

      <h2>Reusable components</h2>
      <p>
        Give a Custom HTML block a name in its &ldquo;Reusable name&rdquo; field, and saving the
        page adds it to your own component library — available from{" "}
        <em>any</em> block&rsquo;s HTML, on any event you own, with a tag like{" "}
        <FileRef>{'<custom-component name="message-card" />'}</FileRef>. Any extra attribute you put
        on that tag (say, <FileRef>message=&quot;Hi!&quot;</FileRef>) becomes a{" "}
        <FileRef>{"{{message}}"}</FileRef> token inside the saved snippet&rsquo;s own HTML/CSS — a
        quick way to build one card, banner, or widget once and drop it in wherever you need it,
        with different text each time.
      </p>

      <DocsPrevNext current="/docs/page-builder/custom-code" />
    </DocsArticle>
  );
}
