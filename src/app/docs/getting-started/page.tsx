import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Getting started",
  description: "Design the invitation, share one link, watch the RSVPs arrive — in about two minutes.",
  openGraph: { images: ["/docs/screenshots/page-builder-overview.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/page-builder-overview.png"] },
};

export default function GettingStartedPage() {
  return (
    <DocsArticle
      title="Getting started"
      description="Design the invitation, share one link, watch the RSVPs arrive — in about two minutes."
      current="/docs/getting-started"
    >
      <p>
        This walks through the shortest real path through ahvaan: sign up, create an event, copy an
        invite link, and see a guest RSVP. Nothing here requires reading anything else first.
      </p>

      <h2>1. Create your account</h2>
      <p>
        Sign up with an email and password (at least 8 characters), or continue with Google. If
        your Supabase project has email confirmation turned on, you&rsquo;ll see a &ldquo;check your
        email to confirm it, then sign in&rdquo; message instead of landing straight in the
        dashboard — confirm, then sign in normally.
      </p>

      <h2>2. Create an event</h2>
      <p>
        From the dashboard, click <strong>Create event</strong> and fill in a title, date, and
        venue. Every event starts as a <strong>draft</strong> — its guest page exists but isn&rsquo;t
        reachable until you publish it from the event&rsquo;s Settings tab. This lets you design
        privately before anyone can see the page.
      </p>
      <Screenshot src="event-settings" alt="Event settings page showing the Draft badge and Publish button" />

      <h2>3. Design the page</h2>
      <p>
        Open the event&rsquo;s <strong>Invite page</strong> tab to reach the page builder. Every new
        event starts with a hero, an RSVP form, and a venue map already in place — see{" "}
        <Link href="/docs/page-builder" className="text-accent hover:underline">the page builder guide</Link> for every block you can add.
      </p>
      <Screenshot src="page-builder-overview" alt="The page builder canvas with the component palette open" />

      <h2>4. Invite a guest</h2>
      <p>
        Go to the event&rsquo;s <strong>Guests</strong> tab and add a named invite. Each invite gets
        its own personal link — copy it and open it in an incognito window to see exactly what that
        guest sees: their name pre-filled, ready to RSVP.
      </p>

      <h2>5. Watch the RSVP arrive</h2>
      <p>
        Submit the form in that incognito window, then go back to the Guests tab — the invite moves
        from Pending to Responded, and the stat tiles update immediately.
      </p>
      <Screenshot src="guest-dashboard" alt="The guest dashboard showing invite stats and the guest list" />

      <Callout>
        A guest page opened without a personal invite link shows a plain &ldquo;By invitation
        only&rdquo; message instead of an error — this is deliberate, not a bug, so a curious visitor
        never sees a broken page.
      </Callout>

      <DocsPrevNext current="/docs/getting-started" />
    </DocsArticle>
  );
}
