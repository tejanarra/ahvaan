import Link from "next/link";
import { THEMES } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import { ThemeDemo } from "@/components/marketing/theme-demo";
import { Reveal } from "@/components/marketing/reveal";
import { getSessionUser } from "@/lib/supabase/auth-server";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{children}</p>
  );
}

/* ---------- miniature product vignettes (pure presentation) ---------- */

function BuilderVignette() {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)]">
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
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)]">
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
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgb(33_30_25/0.06)]">
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
  ["Is it really free?", "Yes — all of it. Unlimited events, unlimited guests, every feature. No trials, no locked tiers, no card required."],
  ["Do guests need an account?", "Never. Each guest gets a personal link — they open it, tap their answer, and they're done. It works in any browser on any phone."],
  ["Can I change my page after sending invites?", "Yes. Your page is live — edit the design, the details, or the RSVP questions any time, and every guest link shows the latest version instantly."],
  ["What kinds of events is it for?", "Any gathering with a guest list: weddings, birthdays, baby showers, dinner parties, reunions. Pick a theme that fits and make it yours."],
  ["Can I answer for a guest?", "Yes — if someone RSVPs by phone or text, you can add or edit their response yourself and your counts stay accurate."],
] as const;

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="min-h-dvh bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="ahvaan home">
            <BrandLockup />
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
            <Eyebrow>RSVP made easy · Free forever · No guest accounts</Eyebrow>
            <h1 className="mt-4 text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-[3.4rem] font-display">
              Design the <em className="text-accent">invitation</em>. Share one link. Watch the RSVPs arrive.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted lg:mx-0">
              ahvaan gives every event a beautiful, fully-customizable page — with built-in
              RSVPs your guests can answer in seconds.
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
            Unlimited events · Unlimited guests · Every RSVP tracked
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

        {/* Deep-dive features */}
        <section className="mx-auto max-w-6xl space-y-20 px-4 pb-20 sm:px-6">
          {(
            [
              [
                "A page builder that's actually yours",
                "Drag blocks anywhere, nest layouts, size and align anything. And when you want pixel-perfect control, add your own code safely.",
                <BuilderVignette key="v" />,
                false,
              ],
              [
                "An RSVP form you control",
                "Meal choices, song requests, plus-ones — ask exactly what you need. Guests answer on their phone in under a minute.",
                <InviteVignette key="v" />,
                true,
              ],
              [
                "Invites and reminders, handled",
                "One-click email invites, and bulk reminders that go only to guests who haven't answered yet — with a delivery log you can trust.",
                <TrackVignette key="v" />,
                false,
              ],
            ] as const
          ).map(([title, body, vignette, flip]) => (
            <Reveal key={title as string}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={flip ? "md:order-2" : undefined}>
                  <h3 className="text-2xl text-foreground sm:text-3xl font-display">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{body}</p>
                </div>
                <div className={flip ? "md:order-1" : undefined}>{vignette}</div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* Theme gallery */}
        <section className="border-t border-border bg-surface-sunken/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <Eyebrow>Themes</Eyebrow>
              <h2 className="mt-3 text-3xl text-foreground sm:text-4xl font-display">
                Start from a look you <em className="text-accent">love</em>
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {THEMES.map((t) => (
                <Reveal key={t.id}>
                  <div className="overflow-hidden rounded-xl border border-border bg-surface transition-transform duration-150 hover:-translate-y-0.5">
                    <div
                      className="flex h-28 flex-col items-center justify-center px-3 text-center"
                      style={{ background: t.colors.background, color: t.colors.foreground }}
                    >
                      <p className="text-lg font-display">
                        Maya &amp; Julien
                      </p>
                      <div className="mt-2 h-px w-10" style={{ background: t.colors.accent }} />
                      <p className="mt-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: t.colors.accent }}>
                        June 12
                      </p>
                    </div>
                    <div
                      className="h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${t.colors.accent}, ${t.colors.accentDark})`,
                      }}
                    />
                    <p className="px-3 py-2.5 text-sm font-medium text-foreground">{t.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
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
