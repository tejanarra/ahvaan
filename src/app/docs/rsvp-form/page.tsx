import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "RSVP form",
  description: "What you ask guests when they RSVP, and what happens right after they submit.",
  openGraph: { images: ["/docs/screenshots/rsvp-form-builder.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/rsvp-form-builder.png"] },
};

export default function RsvpFormPage() {
  return (
    <DocsArticle
      title="RSVP form"
      description="What you ask guests when they RSVP, and what happens right after they submit."
      current="/docs/rsvp-form"
    >
      <p>
        Every event has one RSVP form, managed from the event&rsquo;s <strong>Guests → Fields</strong>{" "}
        tab. It starts with three fields — <strong>Name</strong> (short text), <strong>Attending?</strong>{" "}
        (a yes/no multiple choice), and <strong>Plus ones</strong> (a plus-ones list) — enough to run
        an event without any setup.
      </p>
      <Screenshot src="rsvp-form-builder" alt="The RSVP form builder with the field list and a live preview" />

      <h2>Field types</h2>
      <p>
        Beyond the three starter fields, you can add: short text, long text, a dropdown, multiple
        choice, checkboxes, and the plus-ones list type. Add, reorder, or delete any field, including
        the built-in ones.
      </p>

      <h2>Role-tagged fields</h2>
      <p>
        The Name, Attending, and Plus ones fields carry a <strong>role</strong> — a tag that lets the
        app find &ldquo;the field that means attendance&rdquo; even after you relabel it, independent
        of its position in the form. A role-tagged field&rsquo;s type and options are locked in place
        (attendance always stays a yes/no choice, for instance) so the data it produces stays
        trustworthy — but its label, whether it&rsquo;s required, and its position are all still
        freely editable, and you can delete it outright if you want to change how that part of your
        form works.
      </p>

      <Callout title="If you delete a role field">
        Deleting Attending or Plus ones doesn&rsquo;t break anything — the{" "}
        <Link href="/docs/guests" className="text-accent hover:underline">
          guest dashboard
        </Link>{" "}
        simply hides the corresponding stat tile (Attending, Declined, or Guests) instead of showing
        a misleading zero. Responses still come in through whatever fields remain.
      </Callout>

      <p>
        If you switch an event&rsquo;s submission mode to email-verified (in Guests → Settings), an
        Email field is added to the form automatically so submissions can be tied to a verified
        address.
      </p>

      <h2>After a guest submits</h2>
      <p>
        The <strong>Actions</strong> tab controls what a guest sees right after RSVPing: a
        confirmation message (with separate headings for &ldquo;yes&rdquo; and &ldquo;no&rdquo;
        responses, and an option to show the venue), a redirect to another URL, or fully custom
        HTML/CSS.
      </p>
      <Screenshot src="rsvp-post-submit-actions" alt="The Actions tab with message, redirect, and custom HTML options" />

      <DocsPrevNext current="/docs/rsvp-form" />
    </DocsArticle>
  );
}
