import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "RSVP form block",
  description: "The form guests actually respond with — every new event starts with one already in place.",
  openGraph: { images: ["/docs/screenshots/block-rsvp-form-properties.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/block-rsvp-form-properties.png"] },
};

export default function RsvpFormBlockPage() {
  return (
    <DocsArticle
      title="RSVP form block"
      description="The form guests actually respond with — every new event starts with one already in place."
      current="/docs/page-builder/blocks/rsvp-form"
    >
      <p>
        The form guests actually respond with — every new event starts with one already in
        place.
      </p>
      <Screenshot
        src="block-rsvp-form-properties"
        alt="The RSVP form block's Properties Panel with heading and helper text fields next to a live Preview pane"
        caption="The Preview pane on the right shows exactly how the current heading and helper text render above the form."
      />

      <h2>Settings</h2>
      <ul>
        <li>
          <strong>Heading</strong> (<code>heading</code>) and <strong>Helper text</strong> (
          <code>helperText</code>) — shown above the form fields.
        </li>
        <li>
          <strong>By-invitation-only heading/message</strong> (<code>noInviteHeading</code>,{" "}
          <code>noInviteMessage</code>) — shown instead of the form when a visitor has no personal
          invite link, for private events.
        </li>
        <li>
          <strong>Deadline-closed heading/message</strong> (<code>deadlineClosedHeading</code>,{" "}
          <code>deadlineClosedMessage</code>) — shown instead of the form after the event&rsquo;s
          RSVP deadline has passed.
        </li>
      </ul>
      <p>
        The actual form fields it renders, and what happens right after a guest submits, are
        configured elsewhere — see{" "}
        <Link href="/docs/rsvp-form" className="text-accent hover:underline">
          the RSVP form guide
        </Link>{" "}
        and the event&rsquo;s Guests → Actions tab.
      </p>

      <DocsPrevNext current="/docs/page-builder/blocks/rsvp-form" />
    </DocsArticle>
  );
}
