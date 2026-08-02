import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Form block",
  description: "Embeds one of your own saved custom forms — a guest book message, a song request, dietary details, whatever you've built.",
  openGraph: { images: ["/docs/screenshots/block-form-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-form-properties.png"] },
};

export default function FormBlockPage() {
  return (
    <DocsArticle
      title="Form block"
      description="Embeds one of your own saved custom forms — a guest book message, a song request, dietary details, whatever you've built."
      current="/docs/page-builder/blocks/form"
    >
      <p>
        Embeds one of your own saved custom forms — a guest book message, a song request, dietary
        details, whatever you&rsquo;ve built under the event&rsquo;s Forms tab (see{" "}
        <Link href="/docs/custom-forms" className="text-accent hover:underline">
          custom forms
        </Link>
        ).
      </p>
      <Screenshot
        src="block-form-properties"
        alt="The Form block's Properties Panel with a form picker, heading, and helper text fields next to a live Preview pane"
        caption="The Preview pane on the right renders the actual saved form the current settings point at."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Which form?</strong> (<code>formId</code>) — a dropdown of the event&rsquo;s
          saved forms by name.
        </li>
        <li>
          <strong>Heading</strong> (<code>heading</code>) and <strong>Helper text</strong> (
          <code>helperText</code>).
        </li>
      </ul>
      <Callout>
        The palette itself skips the generic &ldquo;Form&rdquo; entry and instead lists each of
        your saved forms by name under <strong>Guest interaction</strong> — clicking or dragging
        one creates a Form block already pointed at that form, so it renders immediately with no
        follow-up &ldquo;which form?&rdquo; step. If no forms exist yet, that section just prompts
        you to create one under the Forms tab first.
      </Callout>

      <DocsPrevNext current="/docs/page-builder/blocks/form" />
    </DocsArticle>
  );
}
