import Link from "next/link";
import { BrandLockup } from "@/components/brand";

export const metadata = { title: "Terms of Service" };

// docs/08 "Legal minimum" — plain-language terms matching what this app
// actually offers (free, no billing anywhere in this codebase). Written
// for launch; have it reviewed by counsel before it's the last word.
export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/" aria-label="Gatherie home" className="inline-flex">
        <BrandLockup />
      </Link>
      <h1 className="mt-8 text-3xl text-foreground font-display">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 2026-07-30</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          These terms cover your use of Gatherie — a free tool for building event-invitation pages,
          sending personal guest links, and collecting RSVPs. By creating an account or using the
          product, you agree to them.
        </p>

        <section>
          <h2 className="text-base font-semibold">The service</h2>
          <p className="mt-2">
            Gatherie is free, with no paid plans or billing. We may add, change, or remove features
            over time, and we&rsquo;ll try not to break anything you&rsquo;re relying on without notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your account</h2>
          <p className="mt-2">
            You&rsquo;re responsible for the accuracy of what you enter and for anything published under
            your account, including custom HTML/CSS/JS you add to your event page. Don&rsquo;t use
            Gatherie to collect information you don&rsquo;t have a right to collect, to send unwanted or
            deceptive email through the invite/reminder feature, or to publish unlawful, harassing, or
            malicious content.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your content, your responsibility</h2>
          <p className="mt-2">
            You keep ownership of the event details, page content, and form questions you create.
            Custom code you add to your event page runs only inside a sandboxed frame on your own
            page — it can&rsquo;t access other hosts&rsquo; data or the rest of the site, but you&rsquo;re
            responsible for what it does within your own page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Guest data</h2>
          <p className="mt-2">
            If you invite guests and collect RSVPs, you&rsquo;re the one deciding what to ask and how to
            use the answers — treat your guests&rsquo; information the way you&rsquo;d want your own treated.
            See our <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>{" "}
            for what we store and why.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Availability</h2>
          <p className="mt-2">
            We aim to keep Gatherie available and your data intact, but we can&rsquo;t guarantee
            uninterrupted service, and we&rsquo;re not liable for lost RSVPs, missed deadlines, or other
            damages arising from downtime, bugs, or data loss. Keep your own copy of anything
            irreplaceable (e.g. export your guest list to CSV before an important deadline).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Ending an account</h2>
          <p className="mt-2">
            You can delete any event (and its invites/RSVPs) at any time. We may suspend or remove
            accounts that violate these terms or abuse the service (e.g. spam, security probing).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Changes</h2>
          <p className="mt-2">
            If these terms change materially, we&rsquo;ll update the date above and, where practical, let
            signed-in hosts know.
          </p>
        </section>
      </div>
    </div>
  );
}
