import Link from "next/link";
import { THEMES } from "@/lib/themes";

export default function Home() {
  return (
    <div className="min-h-dvh bg-lavender">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-lg uppercase tracking-[0.15em] text-gold-dark">
          Invitely
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-display text-xs uppercase tracking-wider text-gold-dark hover:underline"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-gold-dark px-4 py-2 font-display text-xs uppercase tracking-wider text-white shadow-sm transition hover:bg-[#5c3a0c]"
          >
            Get started free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl uppercase tracking-[0.1em] text-gold-dark sm:text-4xl">
          Beautiful invites. Effortless RSVPs.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-foreground/70">
          Create a themed invitation page for any event — weddings, birthdays,
          baby showers, and more — send personal links to your guests, and
          track every RSVP in one place. Completely free.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-lg bg-gold-dark px-6 py-3 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c]"
        >
          Create your event
        </Link>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm"
            >
              <div
                className="h-20"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                }}
              />
              <p className="px-3 py-2 text-left text-sm font-medium text-foreground">
                {theme.label}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
