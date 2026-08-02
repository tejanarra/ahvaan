import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import { ThemeDemo } from "@/components/marketing/theme-demo";
import { StudioTour } from "@/components/marketing/studio-tour";
import { Reveal } from "@/components/marketing/reveal";
import { getSessionUser } from "@/lib/supabase/auth-server";
import { UserIcon, ShareIcon, MailIcon, ClipboardListIcon } from "@/components/icons";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{children}</p>
  );
}

/* ---------- miniature product vignettes (pure presentation) ---------- */

function BuilderVignette() {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)] transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex-1 space-y-2">
        {["Hero", "Countdown", "RSVP form", "Venue map"].map((b, i) => (
          <div
            key={b}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              i === 2 ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"
            }`}
          >
            <span className="inline-flex flex-col gap-[3px]" aria-hidden="true">
              <span className="h-[2px] w-3 rounded bg-current opacity-40" />
              <span className="h-[2px] w-3 rounded bg-current opacity-40" />
            </span>
            {b}
          </div>
        ))}
      </div>
      <div className="hidden w-24 shrink-0 flex-col gap-1.5 rounded-lg bg-surface-sunken p-2 sm:flex" aria-hidden="true">
        <div className="h-6 rounded bg-border" />
        <div className="h-3 rounded bg-border/70" />
        <div className="h-10 rounded bg-accent-soft" />
        <div className="h-6 rounded bg-border/70" />
      </div>
    </div>
  );
}

function InviteVignette() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)] transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Amara Osei</p>
          <p className="text-xs text-muted">Pending invite</p>
        </div>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
          Personal link
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-sunken px-3 py-2">
        <p className="flex-1 truncate font-mono text-[11px] text-muted">ahvaan.app/e/maya-julien?i=8f2…</p>
        <span className="text-xs font-semibold text-accent">Copy</span>
      </div>
    </div>
  );
}

function TrackVignette() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)] transition-transform duration-150 hover:-translate-y-0.5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["42", "Attending"],
          ["6", "Declined"],
          ["9", "Pending"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-lg bg-surface-sunken px-2 py-3">
            <p className="text-xl tabular-nums text-foreground font-display">
              {n}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
        <div className="h-full w-[74%] rounded-full bg-accent" />
      </div>
      <p className="mt-2 text-xs text-muted">74% of your guests have answered</p>
    </div>
  );
}

/* -------------------------------- page -------------------------------- */

const FAQS = [
  ["Is it really free?", "Yes — all of it. Unlimited events, unlimited guests, every feature, every template. No trials, no locked tiers, no card required, and no ads."],
  ["Do guests need an account?", "Never. Each guest gets a personal link — they open it, tap their answer, and they're done. It works in any browser on any phone."],
  ["Can I change my page after sending invites?", "Yes. Your page is live — edit the design, the details, or the RSVP questions any time, and every guest link shows the latest version instantly."],
  ["What kinds of events is it for?", "Any gathering with a guest list: weddings, birthdays, baby showers, dinner parties, reunions. Pick a theme that fits and make it yours."],
  ["Can I answer for a guest?", "Yes — if someone RSVPs by phone or text, you can add or edit their response yourself and your counts stay accurate."],
  ["Is my guest data mine?", "Yes. Export your full guest list and every response to CSV whenever you want — nothing is locked into ahvaan."],
  ["Can I add my own code to the page?", "Yes, at the block or whole-page level. It runs sandboxed, so it can't touch your account or anyone else's."],
] as const;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Organization + WebSite JSON-LD — the marketing home page's one shot at
// entity/brand structured data (docs pages get their own BreadcrumbList +
// Article/TechArticle data, see components/docs/docs-ui.tsx's DocsArticle).
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "ahvaan",
      url: siteUrl,
      logo: `${siteUrl}/icon.png`,
    },
    {
      "@type": "WebSite",
      name: "ahvaan",
      url: siteUrl,
      description:
        "Design a beautiful invitation page for any event, share one link with your guests, and track every RSVP in one place.",
    },
  ],
};

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="min-h-dvh bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="ahvaan home">
            <BrandLockup markClassName="h-7 w-7 sm:h-8 sm:w-8" textClassName="text-xl font-semibold leading-none font-display sm:text-2xl" />
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="md">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="md">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="md">
                    <span className="sm:hidden">Get started</span>
                    <span className="hidden sm:inline">Get started free</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Eyebrow>Free forever · No ads · No guest accounts</Eyebrow>
            <h1 className="mt-4 text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-[3.4rem] font-display">
              Design the <em className="text-accent">invitation</em>. Share one link. Watch the RSVPs arrive.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted lg:mx-0">
              ahvaan is a completely free app for building and sending event invitations —
              no ads, no locked tiers. Start from a free template or build your page from
              scratch, share one link with your guests, and track every RSVP in one
              dashboard — no guest accounts, no spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/signup">
                <Button size="lg">Create your event</Button>
              </Link>
              <a href="#how">
                <Button variant="ghost" size="lg">
                  See how it works ↓
                </Button>
              </a>
            </div>
          </div>
          <ThemeDemo />
        </section>

        {/* Honest facts strip */}
        <div className="border-y border-border bg-surface-sunken/60">
          <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:px-6">
            Free templates to start · Fully customizable · No ads, ever
          </p>
        </div>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 max-w-lg text-3xl text-foreground sm:text-4xl font-display">
              Three steps to a <em className="text-accent">lovely</em> guest list
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
            {(
              [
                ["1", "Create & design", "Pick a theme, then make the page yours — rearrange blocks, add photos and a countdown, live preview included.", <BuilderVignette key="v" />],
                ["2", "Invite your guests", "Every guest gets their own personal link. Copy it, share it, or email it right from your guest list.", <InviteVignette key="v" />],
                ["3", "Track every RSVP", "Answers land in your dashboard the moment guests tap them — searchable, sortable, and editable by you.", <TrackVignette key="v" />],
              ] as const
            ).map(([n, title, body, vignette]) => (
              <Reveal key={n}>
                <p className="text-3xl text-border-strong font-display" aria-hidden="true">
                  {n}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mb-5 mt-2 text-sm leading-relaxed text-muted">{body}</p>
                {vignette}
              </Reveal>
            ))}
          </div>
        </section>

        {/* Everything you need, in one place — the real dashboard, live */}
        <section className="border-t border-border bg-surface-sunken/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <Reveal>
                <Eyebrow>Everything included</Eyebrow>
                <h2 className="mt-3 text-3xl text-foreground sm:text-4xl font-display">
                  This isn&rsquo;t a mockup — it&rsquo;s <em className="text-accent">your dashboard</em>
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
                  Click through Guests, Invite page, Forms, and Settings below — it&rsquo;s the
                  exact workspace you&rsquo;ll get, no trial, no paywall, no &ldquo;upgrade to
                  unlock.&rdquo;
                </p>
                <div className="mt-6 flex flex-wrap gap-2" aria-label="Also included">
                  {[
                    "Per-device layout control",
                    "Sandboxed custom code",
                    "Draft & publish control",
                    "Optional RSVP deadline",
                    "CSV export anytime",
                    "Public host profile",
                    "Delivery-logged reminders",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </Reveal>
              <Reveal>
                <StudioTour />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Deep-dive features */}
        <section className="mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-20 sm:px-6">
          {(
            [
              [
                "Page builder",
                "A page builder that's actually yours",
                "Drag blocks anywhere, nest layouts, size and align anything. And when you want pixel-perfect control, add your own code safely.",
                <BuilderVignette key="v" />,
                false,
              ],
              [
                "RSVP form",
                "An RSVP form you control",
                "Meal choices, song requests, plus-ones — ask exactly what you need. Guests answer on their phone in under a minute.",
                <InviteVignette key="v" />,
                true,
              ],
              [
                "Communication",
                "Invites and reminders, handled",
                "One-click email invites, and bulk reminders that go only to guests who haven't answered yet — with a delivery log you can trust.",
                <TrackVignette key="v" />,
                false,
              ],
            ] as const
          ).map(([eyebrow, title, body, vignette, flip]) => (
            <Reveal key={title as string}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={flip ? "md:order-2" : undefined}>
                  <Eyebrow>{eyebrow}</Eyebrow>
                  <h3 className="mt-2 text-2xl text-foreground sm:text-3xl font-display">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{body}</p>
                </div>
                <div className={flip ? "md:order-1" : undefined}>{vignette}</div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* Who can submit — situational use cases for the submission-mode system */}
        <section className="border-t border-border bg-surface-sunken/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <Eyebrow>Who can respond</Eyebrow>
              <h2 className="mt-3 max-w-xl text-3xl text-foreground sm:text-4xl font-display">
                Every guest list is different. <em className="text-accent">Yours can match.</em>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                One setting on your event decides who&rsquo;s allowed to respond and how a second
                submission is handled — for the RSVP form and every custom form, together. Pick
                the one that fits how you&rsquo;re actually sending invites.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {(
                [
                  [
                    <UserIcon key="i" className="h-5 w-5" />,
                    "Private",
                    "You've got a real guest list.",
                    "A wedding, a milestone birthday, a private dinner — every guest gets their own personal link. Only that link gets in, one response per guest, and reopening it shows their answer ready to edit. No duplicates, no guessing who replied.",
                  ],
                  [
                    <ShareIcon key="i" className="h-5 w-5" />,
                    "Anonymous",
                    "You just want answers, fast.",
                    "A team lunch poll, a casual open house, a quick \"who's in\" — share one link anywhere and let anyone respond, no identity check, no account. Perfect when knowing exactly who answered matters less than getting a headcount.",
                  ],
                  [
                    <MailIcon key="i" className="h-5 w-5" />,
                    "Email verified",
                    "It's open, but it still needs to be real.",
                    "A public fundraiser, a community event, an invite forwarded past your original list — anyone can respond, but a quick emailed code confirms they're a real, unique person first. One response per verified email, and they can return with an \"Already responded?\" link to edit it.",
                  ],
                ] as const
              ).map(([icon, label, hook, body]) => (
                <Reveal key={label as string}>
                  <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-transform duration-150 hover:-translate-y-0.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                      {icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-accent">{label}</h3>
                      <p className="mt-1 font-display text-lg text-foreground">{hook}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <ClipboardListIcon className="h-4 w-4" />
                </span>
                <p className="text-sm text-muted">
                  Whichever mode you choose, every response — RSVP or custom form — lands in the
                  same searchable dashboard, and exports to CSV whenever you need it.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="text-center text-3xl text-foreground sm:text-4xl font-display">
              Questions, <em className="text-accent">answered</em>
            </h2>
          </Reveal>
          <div className="mt-8">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    className="shrink-0 text-xl font-light text-muted transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-surface-sunken">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl leading-tight text-foreground sm:text-4xl font-display">
              Your event deserves better than a <em className="text-accent">group chat</em>.
            </h2>
            <Link href="/signup" className="mt-8 inline-block">
              <Button size="lg">Create your event</Button>
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Free · Unlimited guests
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
