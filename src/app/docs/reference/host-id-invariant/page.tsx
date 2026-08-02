import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "The host_id invariant",
  description: "Every host-owned row is scoped by host_id in application code — the full narrative is in docs/02-architecture-review.md.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("The host_id invariant")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("The host_id invariant")}&section=Reference`] },
};

export default function HostIdInvariantReferencePage() {
  return (
    <DocsArticle
      title="The host_id invariant"
      description="Every host-owned row is scoped by host_id in application code — the full narrative is in docs/02-architecture-review.md."
      current="/docs/reference/host-id-invariant"
    >
      <p>
        Every table a host owns (<FileRef>events</FileRef>, <FileRef>invites</FileRef>,{" "}
        <FileRef>rsvps</FileRef>, <FileRef>forms</FileRef>, <FileRef>form_submissions</FileRef>, &hellip;)
        carries a denormalized <FileRef>host_id</FileRef> column, and every host-scoped function in{" "}
        <FileRef>src/lib/data/</FileRef> takes <FileRef>hostId</FileRef> as an explicit argument and
        filters on it — never trusting a client-supplied row id alone to prove ownership.
      </p>

      <h2>Read and write, scoped the same way</h2>
      <p>
        <FileRef>getEventFull</FileRef> (
        <FileRef>src/lib/data/events.ts:92</FileRef>, filter at{" "}
        <FileRef>src/lib/data/events.ts:97-98</FileRef>) and <FileRef>deleteEvent</FileRef> (
        <FileRef>src/lib/data/events.ts:346</FileRef>, filter at{" "}
        <FileRef>src/lib/data/events.ts:348</FileRef>) both chain <FileRef>.eq(&quot;id&quot;,
        eventId).eq(&quot;host_id&quot;, hostId)</FileRef> before touching the row — an event id alone
        (guessable, or leaked from another host&rsquo;s browser tab) is never enough to read or delete
        it. The same shape repeats for every mutation on <FileRef>events</FileRef>:{" "}
        <FileRef>updateEventDetails</FileRef> (<FileRef>src/lib/data/events.ts:232</FileRef>),{" "}
        <FileRef>updatePageSchema</FileRef> (<FileRef>src/lib/data/events.ts:382</FileRef>), and the
        rest of the <FileRef>update*</FileRef> functions in that file.
      </p>
      <p>
        <FileRef>src/lib/data/invites.ts</FileRef> and <FileRef>src/lib/data/form-submissions.ts</FileRef>{" "}
        follow the identical pattern for their own tables:{" "}
        <FileRef>deleteInvite</FileRef> (<FileRef>src/lib/data/invites.ts:46</FileRef>) filters{" "}
        <FileRef>.eq(&quot;id&quot;, inviteId).eq(&quot;event_id&quot;, eventId).eq(&quot;host_id&quot;,
        hostId)</FileRef> at <FileRef>src/lib/data/invites.ts:51-53</FileRef>, and{" "}
        <FileRef>deleteSubmission</FileRef> (
        <FileRef>src/lib/data/form-submissions.ts:140</FileRef>) filters{" "}
        <FileRef>.eq(&quot;host_id&quot;, hostId).eq(&quot;form_id&quot;, formId).eq(&quot;id&quot;,
        submissionId)</FileRef> at <FileRef>src/lib/data/form-submissions.ts:145-147</FileRef>. In both
        files the calling server action already resolved <FileRef>hostId</FileRef> from{" "}
        <FileRef>requireHost()</FileRef> — it is never read off the request body.
      </p>

      <h2>The deliberate exception: guest-facing reads</h2>
      <p>
        A handful of functions are named <FileRef>*Public</FileRef> and are intentionally not scoped by{" "}
        <FileRef>host_id</FileRef> at all, because the caller (a guest&rsquo;s browser) has no host
        session to prove one. <FileRef>getInvitePublic</FileRef> (
        <FileRef>src/lib/data/invites.ts:92</FileRef>) is the clearest example — its own comment at{" "}
        <FileRef>src/lib/data/invites.ts:90-91</FileRef> says it outright:
      </p>
      <p>
        <em>
          &ldquo;Guest-facing lookup &mdash; deliberately unscoped by host_id (the invite id itself is
          the access control for the public RSVP flow).&rdquo;
        </em>
      </p>
      <p>
        The invite id (a UUID emailed only to that one guest) is the capability token standing in for{" "}
        <FileRef>host_id</FileRef> here — knowing it is what proves you&rsquo;re allowed to see that
        row. <FileRef>getEventByIdPublic</FileRef> (<FileRef>src/lib/data/events.ts:168-178</FileRef>)
        and <FileRef>getEventBySlugPublic</FileRef> (<FileRef>src/lib/data/events.ts:151-153</FileRef>)
        are scoped the same way, by the event&rsquo;s own id/slug (and, for the id lookup,{" "}
        <FileRef>status = &apos;published&apos;</FileRef> — see the comment above{" "}
        <FileRef>getEventByIdPublic</FileRef> explaining why a draft event&rsquo;s id must still 404
        even if it leaks). None of these omit scoping outright; they scope by a different secret
        instead of <FileRef>host_id</FileRef>.
      </p>

      <h2>Convention, not Postgres RLS</h2>
      <p>
        This is enforced by code convention across <FileRef>src/lib/data/</FileRef>, not by Postgres
        row-level security policies. <FileRef>supabase/schema-saas.sql:10-12</FileRef> enables RLS on
        every table but attaches no policies — a deliberate deny-all backstop (the anon/authenticated
        keys have zero access either way, so a leaked anon key can&rsquo;t read anyone&rsquo;s data),
        not the primary tenancy mechanism. The service-role client used throughout{" "}
        <FileRef>src/lib/data/</FileRef> bypasses RLS entirely, so the <FileRef>.eq(&quot;host_id&quot;,
        hostId)</FileRef> filter in each function body is the actual authorization check.
      </p>

      <Callout>
        Before adding any new query to <FileRef>src/lib/data/</FileRef>: host reads and writes always
        filter <FileRef>host_id</FileRef> from an argument the caller resolved via{" "}
        <FileRef>requireHost()</FileRef>, never from client input. A public/guest-facing read is
        scoped by a different capability token instead (an invite id, an event slug, a verified
        email) — it is never left unscoped entirely.
      </Callout>

      <DocsPrevNext current="/docs/reference/host-id-invariant" />
    </DocsArticle>
  );
}
