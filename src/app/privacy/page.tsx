import Link from "next/link";
import { BrandLockup } from "@/components/brand";

export const metadata = { title: "Privacy Policy" };

// docs/08 "Legal minimum" — a real, plain-language policy grounded in what
// this app actually does (no ad tech, no analytics, no data sale — none of
// that exists anywhere in this codebase), not generic boilerplate. Written
// for launch; have it reviewed by counsel before it's the last word.
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/" aria-label="Gatherie home" className="inline-flex">
        <BrandLockup />
      </Link>
      <h1 className="mt-8 text-3xl text-foreground font-display">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 2026-07-30</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          Gatherie is an event-invitation tool: a host creates an event page, invites guests with
          personal links, and collects their RSVPs. This page explains what information we collect
          and why.
        </p>

        <section>
          <h2 className="text-base font-semibold">Information we collect</h2>
          <p className="mt-2">
            <strong>Hosts.</strong> When you sign up, we store your email address and an encrypted
            password (via Supabase Auth — we never see your password in plain text). Everything you
            enter about an event (title, date, venue, description, theme, custom page content, form
            questions) is stored so we can render your event page and dashboard.
          </p>
          <p className="mt-2">
            <strong>Guests.</strong> When a host creates an invite, we store the name (and, if the
            host adds it, an email address) they gave you. When a guest submits an RSVP, we store
            whatever answers the form asks for — typically a name, attendance, and any custom
            questions the host added.
          </p>
          <p className="mt-2">
            <strong>We do not</strong> run advertising or analytics trackers, sell or share data with
            data brokers, or collect information beyond what&rsquo;s described above.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How it&rsquo;s used</h2>
          <p className="mt-2">
            Solely to run the product: authenticating hosts, rendering event and RSVP pages, sending
            invite/reminder emails a host asks us to send (via Resend), and showing hosts their own
            guest list and responses. A host can see and manage the guests and RSVPs for their own
            events; they cannot see other hosts&rsquo; events or guests.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Where it&rsquo;s stored</h2>
          <p className="mt-2">
            All data is stored in a Supabase (PostgreSQL) database. Emails are sent through Resend.
            Neither is used for any purpose beyond operating Gatherie on our behalf.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Cookies</h2>
          <p className="mt-2">
            We use one cookie to keep a host signed in (an authentication session cookie). We don&rsquo;t
            use tracking or advertising cookies. Guests never need an account and are never
            cookied — a guest RSVP link identifies them, not a cookie.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your choices</h2>
          <p className="mt-2">
            A host can edit or delete any event, which deletes its invites and RSVPs with it. A guest
            who wants their information removed or corrected can ask the host who invited them (hosts
            can edit or delete any RSVP), or contact us directly and we&rsquo;ll help.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Changes</h2>
          <p className="mt-2">
            If this policy changes in a material way, we&rsquo;ll update the date above and, where
            practical, let signed-in hosts know.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data — reach out to the person or team operating this
            Gatherie instance.
          </p>
        </section>
      </div>
    </div>
  );
}
