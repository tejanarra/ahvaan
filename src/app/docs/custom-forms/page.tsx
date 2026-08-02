import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Custom forms",
  description: "Named forms for anything beyond the RSVP itself — feedback, song requests, T-shirt sizes.",
  openGraph: { images: ["/docs/screenshots/custom-form-builder.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/custom-form-builder.png"] },
};

export default function CustomFormsPage() {
  return (
    <DocsArticle
      title="Custom forms"
      description="Named forms for anything beyond the RSVP itself — feedback, song requests, T-shirt sizes."
      current="/docs/custom-forms"
    >
      <p>
        Custom forms live under an event&rsquo;s <strong>Forms</strong> tab, separate from{" "}
        <Link href="/docs/rsvp-form" className="text-accent hover:underline">
          the RSVP form
        </Link>
        . Create as many as you need — a form for song requests, one for dietary preferences, one for
        a post-event survey — each with its own name, fields, and submissions.
      </p>
      <Screenshot src="forms-list" alt="The Forms tab listing an event's saved custom forms" />

      <Callout title="Two different engines, on purpose">
        The RSVP form tracks guests — it&rsquo;s wired into invite links, the guest dashboard, and
        attendance stats. Custom forms don&rsquo;t track guests or invites at all; they&rsquo;re just
        a named form that collects typed submissions. Use the RSVP form for anything about who&rsquo;s
        coming, and a custom form for everything else — the two are intentionally kept apart rather
        than merged into one do-everything form.
      </Callout>

      <h2>Building a form</h2>
      <p>
        Give the form a name, then add fields from the same kind of field-type list as the RSVP form,
        just wider: short text, long text, email, phone number, number, date, dropdown, multiple
        choice, checkbox, checkboxes (multi-select), and address.
      </p>
      <Screenshot src="custom-form-builder" alt="The custom form builder with a field added and its editor open" />

      <h2>Embedding it on your page</h2>
      <p>
        A custom form isn&rsquo;t visible to guests until you add it to your invite page. Open the{" "}
        <Link href="/docs/page-builder" className="text-accent hover:underline">
          page builder
        </Link>{" "}
        and add a <strong>Form</strong> block — the component palette lists your saved forms by name,
        so you pick which one to embed directly.
      </p>

      <h2>Viewing submissions</h2>
      <p>
        Each form has its own <strong>Data</strong> tab, listing every submission with the form&rsquo;s
        fields as columns, and an export option.
      </p>
      <Screenshot src="custom-form-data" alt="A custom form's Data tab showing a table of submissions" />

      <h2>After a guest submits</h2>
      <p>
        Custom forms have their own <strong>Actions</strong> tab, configured the same way as the RSVP
        form&rsquo;s — a confirmation message, a redirect, or custom HTML — set independently per
        form.
      </p>

      <DocsPrevNext current="/docs/custom-forms" />
    </DocsArticle>
  );
}
