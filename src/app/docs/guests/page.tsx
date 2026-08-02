import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Guests & tracking",
  description: "Every invite and every response, in one list — search, sort, export, and edit by hand when you need to.",
  openGraph: { images: ["/docs/screenshots/guest-dashboard.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/guest-dashboard.png"] },
};

export default function GuestsPage() {
  return (
    <DocsArticle
      title="Guests & tracking"
      description="Every invite and every response, in one list — search, sort, export, and edit by hand when you need to."
      current="/docs/guests"
    >
      <p>
        The Guests tab is where invites and responses live side by side. It splits into two tabs —{" "}
        <strong>Invites</strong> for people who haven&rsquo;t responded yet, and{" "}
        <strong>Responded</strong> for people who have.
      </p>
      <Screenshot src="guest-dashboard" alt="The guest dashboard showing invite stats, search, and the pending invite list" />

      <h2>Stats at a glance</h2>
      <p>
        The tiles across the top always show <strong>Sent</strong>, <strong>Pending</strong>, and{" "}
        <strong>Responded</strong> counts — clicking a tile jumps straight to the matching tab and
        filter. If your RSVP form asks an attendance question, two more tiles appear:{" "}
        <strong>Attending</strong> and <strong>Declined</strong>, plus a <strong>Guests</strong> tile
        counting total headcount including plus-ones. If it doesn&rsquo;t, those tiles are hidden
        rather than shown as a meaningless zero, and a short note explains why — see{" "}
        <Link href="/docs/rsvp-form" className="text-accent hover:underline">the RSVP form guide</Link>{" "}
        for how that attendance field is set up.
      </p>
      <Screenshot src="guest-dashboard-responded" alt="The Responded tab filtered to Attending, with the response cards visible" />

      <h2>Search and sort</h2>
      <p>
        The search box matches a guest&rsquo;s name on the Invites tab, and on the Responded tab it
        also matches any plus-one names attached to their RSVP — so searching a plus-one&rsquo;s
        name finds the RSVP that includes them. Typing more than one word requires every word to
        appear somewhere in that combined name text, in any order. Sort by newest, oldest, or name
        (A–Z / Z–A) from the dropdown next to the search box.
      </p>

      <h2>Sharing an invite link</h2>
      <p>
        <strong>Share invite link</strong> creates one personal link per guest — only that link lets
        them RSVP. Once it&rsquo;s generated you can copy the invite message (with a manual
        &ldquo;tap to select&rdquo; fallback if your browser blocks automatic clipboard access), or,
        on a device that supports it, share it straight to Messages, WhatsApp, or any other app
        through your device&rsquo;s native share sheet.
      </p>
      <Screenshot src="invite-link-share" alt="The share invite modal with the generated link and native share button" />

      <h2>Exporting to CSV</h2>
      <p>
        <strong>Export CSV</strong> downloads every invite and response currently loaded on the page
        — pending and responded, with each RSVP field as its own column — so you always have a
        spreadsheet copy of your guest list without waiting on a separate export step.
      </p>

      <h2>Editing an RSVP by hand</h2>
      <p>
        Open any responded guest&rsquo;s card and choose <strong>Edit</strong> to change their
        answers directly — useful for recording an RSVP that came in over the phone or by text on a
        guest&rsquo;s behalf. The edit form mirrors your RSVP form&rsquo;s exact fields, plus-ones
        included.
      </p>

      <Callout>
        A pending invite with no email attached can&rsquo;t be reminded by email (there&rsquo;s
        nothing to send it to) — the &ldquo;Email all pending&rdquo; button only counts and sends to
        invites that have one on file.
      </Callout>

      <DocsPrevNext current="/docs/guests" />
    </DocsArticle>
  );
}
