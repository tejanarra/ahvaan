import type { Metadata } from "next";
import { DocsArticle, Callout, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Email invites & reminders",
  description: "Send an invite by email, or remind everyone who hasn't responded yet, in one click.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Email invites & reminders")}&section=Guides`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Email invites & reminders")}&section=Guides`] },
};

export default function EmailPage() {
  return (
    <DocsArticle
      title="Email invites & reminders"
      description="Send an invite by email, or remind everyone who hasn't responded yet, in one click."
      current="/docs/email"
    >
      <p>
        Adding an email address to an invite (in the Share invite modal, or when editing an invite)
        unlocks two ways to reach that guest by email, both from the Guests tab.
      </p>

      <h2>Sending one invite</h2>
      <p>
        Any pending invite with an email on file gets a mail icon on its card. Clicking it sends
        that guest an invite email with a button linking straight to their personal RSVP page.
        The icon turns into a checkmark once it&rsquo;s sent.
      </p>

      <h2>Reminding everyone at once</h2>
      <p>
        <strong>Email all pending</strong> sends a reminder to every invite that has an email
        address and hasn&rsquo;t responded yet — one email per guest, sent one at a time. When it
        finishes you&rsquo;ll see how many went out, e.g. &ldquo;Sent 8 of 8&rdquo; or, if some
        failed, &ldquo;Sent 6 of 8 — some failed.&rdquo;
      </p>

      <h2>When a send fails</h2>
      <p>
        A failed send never disappears silently. For a single invite, the mail icon turns red and
        hovering it shows the error message directly. For a bulk reminder run, the failure is
        rolled into that &ldquo;X of Y&rdquo; summary so you know at a glance whether everyone
        actually got theirs. Every send attempt — success or failure — is also recorded behind the
        scenes as it happens, so if you ever need to trace down a delivery problem, that history
        exists.
      </p>

      <Callout>
        Emails are delivered through Resend on ahvaan&rsquo;s side, so a failed send is almost
        always a bad or mistyped address rather than something you need to fix in your own inbox
        settings — double-check the guest&rsquo;s email and try again.
      </Callout>

      <DocsPrevNext current="/docs/email" />
    </DocsArticle>
  );
}
