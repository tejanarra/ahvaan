import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Events",
  description: "Every invitation, RSVP form, and guest list in ahvaan belongs to one event.",
  openGraph: { images: ["/docs/screenshots/event-settings.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/event-settings.png"] },
};

export default function EventsPage() {
  return (
    <DocsArticle
      title="Events"
      description="Every invitation, RSVP form, and guest list in ahvaan belongs to one event."
      current="/docs/events"
    >
      <h2>Creating an event</h2>
      <p>
        From the dashboard, click <strong>Create event</strong> and fill in a title, subtitle
        (optional), event type, theme, date, time (optional), venue name, venue address, and
        description (optional). You can change every one of these later from Settings, and picking
        a theme here is just a starting point — you can switch it any time.
      </p>

      <h2>Draft vs. published</h2>
      <p>
        A new event starts as a <strong>draft</strong>: its guest page and all its blocks already
        exist, but the page isn&rsquo;t reachable at its public link until you publish it from the
        event&rsquo;s Settings tab. This is deliberate — it lets you design the page, add blocks,
        and set up your RSVP form privately, with nothing to see until you&rsquo;re ready to share
        it.
      </p>
      <Screenshot src="event-settings" alt="Event settings page showing the event status and publish control" />

      <Callout>
        If you copy and test your invite link before publishing, it won&rsquo;t load — the guest
        page only exists at that link once the event&rsquo;s status is Published. If a shared link
        seems broken, check Settings first.
      </Callout>

      <h2>RSVP deadline</h2>
      <p>
        Settings also has an optional <strong>RSVP deadline</strong> &mdash; a date and time after
        which the RSVP window closes. Once it passes, the RSVP block on the guest page shows a
        closed message instead of the form (with its own configurable heading and text, editable
        on the RSVP form block itself); guests who already responded can still see their
        confirmation, and you can still add or edit any RSVP yourself from Guests. Leave the
        deadline blank to accept RSVPs indefinitely.
      </p>

      <h2>Editing details later</h2>
      <p>
        Any change you save in Settings — title, date, venue, description, theme, or anything else
        — updates the live guest page immediately. There&rsquo;s no separate &ldquo;republish&rdquo;
        step once an event is published.
      </p>

      <h2>Deleting an event</h2>
      <p>
        Deleting an event from Settings removes it and everything attached to it — guests,
        responses, forms — and also cleans up any images you&rsquo;d uploaded for that event (cover
        photo, block images) from storage. That storage cleanup is best-effort: it happens after
        the event itself is deleted, so a storage hiccup never blocks or fails the delete.
      </p>

      <DocsPrevNext current="/docs/events" />
    </DocsArticle>
  );
}
